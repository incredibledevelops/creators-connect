from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.security import decode_token
from app.database import get_db
from app.utils.serializers import utc

bearer_scheme = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    try:
        payload = decode_token(credentials.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token.")
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type.")
    try:
        oid = ObjectId(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token subject.")

    db = get_db()
    user = await db.users.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")
    return user

async def get_current_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required.")
    return user

async def require_active_subscription(user: dict = Depends(get_current_user)) -> dict:
    sub = user.get("subscription", {})
    now = datetime.now(timezone.utc)
    status_ = sub.get("status")
    end = utc(sub.get("current_period_end")) or utc(sub.get("trial_ends_at"))
    if status_ in ("trialing", "active") and end and end > now:
        return user
    raise HTTPException(
        status_code=402,
        detail="Your free trial or subscription has ended. Please renew to continue.",
    )