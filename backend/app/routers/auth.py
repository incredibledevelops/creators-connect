from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.config import settings
from app.core.security import (
    create_access_token, create_refresh_token, decode_token,
    hash_password, hash_token, verify_password,
)
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.auth import LoginIn, RefreshIn, RegisterIn
from app.utils.serializers import serialize_user

router = APIRouter()


async def _issue_tokens(user_id: ObjectId) -> dict:
    db = get_db()
    access = create_access_token(str(user_id))
    refresh = create_refresh_token(str(user_id))
    await db.refresh_tokens.insert_one({
        "token_hash": hash_token(refresh),
        "user_id": user_id,
        "revoked": False,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        "created_at": datetime.now(timezone.utc),
    })
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}


async def _unique_handle(base: str) -> str:
    db = get_db()
    base = (base or "creator").lower().strip()[:24] or "creator"
    handle = base
    i = 1
    while await db.users.find_one({"handle": handle}):
        i += 1
        handle = f"{base}{i}"
    return handle


@router.post("/register", status_code=201)
async def register(payload: RegisterIn):
    db = get_db()

    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="An account with that email already exists.")

    now = datetime.now(timezone.utc)
    trial_end = now + timedelta(days=settings.TRIAL_DAYS)
    handle = await _unique_handle(payload.email.split("@")[0])

    user_doc = {
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "full_name": payload.full_name.strip(),
        "handle": handle,
        "bio": "",
        "avatar_url": None,
        "role": "creator",
        "subscription": {
            "plan": "trial",
            "status": "trialing",
            "trial_started_at": now,
            "trial_ends_at": trial_end,
            "current_period_start": None,
            "current_period_end": None,
            "last_payment_at": None,
        },
        "created_at": now,
        "updated_at": now,
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    tokens = await _issue_tokens(result.inserted_id)
    return {"user": serialize_user(user_doc), **tokens}


@router.post("/login")
async def login(payload: LoginIn):
    db = get_db()
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    tokens = await _issue_tokens(user["_id"])
    return {"user": serialize_user(user), **tokens}


@router.post("/refresh")
async def refresh(payload: RefreshIn):
    db = get_db()
    try:
        claims = decode_token(payload.refresh_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token.")
    if claims.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type.")

    token_hash = hash_token(payload.refresh_token)
    record = await db.refresh_tokens.find_one({"token_hash": token_hash, "revoked": False})
    if not record:
        raise HTTPException(status_code=401, detail="Refresh token revoked or unknown.")

    # Rotate
    await db.refresh_tokens.update_one({"_id": record["_id"]}, {"$set": {"revoked": True}})

    user_id = record["user_id"]
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")

    tokens = await _issue_tokens(user_id)
    return {"user": serialize_user(user), **tokens}


@router.post("/logout")
async def logout(payload: RefreshIn, user: dict = Depends(get_current_user)):
    db = get_db()
    token_hash = hash_token(payload.refresh_token)
    await db.refresh_tokens.update_one(
        {"token_hash": token_hash, "user_id": user["_id"]},
        {"$set": {"revoked": True}},
    )
    return {"message": "Logged out."}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user": serialize_user(user)}