from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings
from app.core.security import (
    create_access_token, create_refresh_token, create_short_token,
    decode_token, hash_password, hash_token, verify_password,
)
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.auth import (
    ForgotPasswordIn, LoginIn, RefreshIn, RegisterIn, ResetPasswordIn,
    VerifyEmailIn,
)
from app.services import email as email_service
from app.utils import activity as activity_service
from app.utils.serializers import serialize_user

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


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
    base = "".join(c for c in base if c.isalnum() or c in ("_", "."))
    handle = base or "creator"
    i = 1
    while await db.users.find_one({"handle": handle}):
        i += 1
        handle = f"{base}{i}"
    return handle


@router.post("/register", status_code=201)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def register(request: Request, payload: RegisterIn):
    db = get_db()

    if await db.users.find_one({"email": payload.email.lower()}):
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
        "email_verified": False,
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

    # Starter workspace
    await db.workspaces.insert_one({
        "owner_id": result.inserted_id,
        "name": f"{user_doc['full_name'].split(' ')[0]}'s Studio",
        "plan": "trial",
        "member_ids": [result.inserted_id],
        "created_at": now,
        "updated_at": now,
    })

    # Send verification email
    token = create_short_token(str(result.inserted_id), "email_verify", 60 * 24)
    await db.email_verifications.insert_one({
        "user_id": result.inserted_id,
        "token_hash": hash_token(token),
        "expires_at": now + timedelta(days=1),
        "created_at": now,
    })
    link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    subject, html = email_service.verify_email_email(user_doc["full_name"], link)
    try:
        await email_service.send_email(user_doc["email"], subject, html)
    except Exception as e:
        print(f"[email] verification email failed: {e}")

    await activity_service.emit(
        result.inserted_id,
        kind="account_created",
        title="Welcome to Creators Connect",
        description="Your 14-day Pro trial has started.",
    )

    tokens = await _issue_tokens(result.inserted_id)
    return {"user": serialize_user(user_doc), **tokens}


@router.post("/login")
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def login(request: Request, payload: LoginIn):
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
    await db.refresh_tokens.update_one(
        {"token_hash": hash_token(payload.refresh_token), "user_id": user["_id"]},
        {"$set": {"revoked": True}},
    )
    return {"message": "Logged out."}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user": serialize_user(user)}


# ---------- Forgot / Reset password ----------
@router.post("/forgot-password")
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def forgot_password(request: Request, payload: ForgotPasswordIn):
    db = get_db()
    user = await db.users.find_one({"email": payload.email.lower()})
    # Always return 200 to avoid user enumeration
    if user:
        now = datetime.now(timezone.utc)
        token = create_short_token(str(user["_id"]), "password_reset", 30)
        await db.password_resets.insert_one({
            "user_id": user["_id"],
            "token_hash": hash_token(token),
            "expires_at": now + timedelta(minutes=30),
            "created_at": now,
        })
        link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        subject, html = email_service.reset_password_email(user["full_name"], link)
        try:
            await email_service.send_email(user["email"], subject, html)
        except Exception as e:
            print(f"[email] reset email failed: {e}")
    return {"message": "If that email exists, a reset link has been sent."}


@router.post("/reset-password")
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def reset_password(request: Request, payload: ResetPasswordIn):
    db = get_db()
    try:
        claims = decode_token(payload.token)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
    if claims.get("type") != "password_reset":
        raise HTTPException(status_code=400, detail="Invalid token type.")

    token_hash = hash_token(payload.token)
    record = await db.password_resets.find_one({"token_hash": token_hash})
    if not record or record["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    user_id = record["user_id"]
    await db.users.update_one(
        {"_id": user_id},
        {"$set": {"password_hash": hash_password(payload.new_password),
                  "updated_at": datetime.now(timezone.utc)}},
    )
    await db.password_resets.delete_many({"user_id": user_id})
    # Revoke refresh tokens
    await db.refresh_tokens.update_many({"user_id": user_id}, {"$set": {"revoked": True}})
    return {"message": "Password updated. Please sign in."}


# ---------- Verify email ----------
@router.post("/verify-email")
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def verify_email(request: Request, payload: VerifyEmailIn):
    db = get_db()
    try:
        claims = decode_token(payload.token)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token.")
    if claims.get("type") != "email_verify":
        raise HTTPException(status_code=400, detail="Invalid token type.")

    token_hash = hash_token(payload.token)
    record = await db.email_verifications.find_one({"token_hash": token_hash})
    if not record or record["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired verification token.")

    await db.users.update_one(
        {"_id": record["user_id"]},
        {"$set": {"email_verified": True, "updated_at": datetime.now(timezone.utc)}},
    )
    await db.email_verifications.delete_many({"user_id": record["user_id"]})
    return {"message": "Email verified."}


@router.post("/resend-verification")
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def resend_verification(request: Request, user: dict = Depends(get_current_user)):
    db = get_db()
    if user.get("email_verified"):
        return {"message": "Already verified."}
    now = datetime.now(timezone.utc)
    token = create_short_token(str(user["_id"]), "email_verify", 60 * 24)
    await db.email_verifications.delete_many({"user_id": user["_id"]})
    await db.email_verifications.insert_one({
        "user_id": user["_id"],
        "token_hash": hash_token(token),
        "expires_at": now + timedelta(days=1),
        "created_at": now,
    })
    link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    subject, html = email_service.verify_email_email(user["full_name"], link)
    try:
        await email_service.send_email(user["email"], subject, html)
    except Exception as e:
        print(f"[email] resend failed: {e}")
    return {"message": "Verification email resent."}