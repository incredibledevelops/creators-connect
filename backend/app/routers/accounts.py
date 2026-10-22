from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from app.config import settings
from app.core.security import encrypt_secret
from app.database import get_db
from app.dependencies import get_current_user
from app.services import social_oauth
from app.utils.serializers import doc_to_dict

router = APIRouter()

@router.get("")
async def list_accounts(user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.social_accounts.find({"user_id": user["_id"]})
    docs = await cursor.to_list(length=20)
    return {"accounts": [doc_to_dict(d, remove=["access_token_enc", "refresh_token_enc"]) for d in docs]}

@router.get("/connect/{platform}")
async def get_auth_url(platform: str, user: dict = Depends(get_current_user)):
    if platform == "youtube":
        url = social_oauth.get_youtube_auth_url()
    elif platform in ["instagram", "facebook"]:
        url = social_oauth.get_meta_auth_url(platform)
    elif platform == "tiktok":
        url = social_oauth.get_tiktok_auth_url(state=str(user["_id"]))
    elif platform == "x":
        url, verifier = social_oauth.get_x_auth_url()
        # Store verifier temporarily in DB to verify on callback
        await get_db().oauth_states.insert_one({"user_id": user["_id"], "verifier": verifier})
    else:
        raise HTTPException(status_code=400, detail="Unsupported platform")
    
    return {"authorization_url": url}

@router.get("/{platform}/callback")
async def oauth_callback(platform: str, code: str, state: str = None):
    db = get_db()
    user_id = None
    
    try:
        if platform == "youtube":
            tokens = await social_oauth.exchange_youtube_code(code)
            user_id = ObjectId(state) # state is not passed in YT URL, using placeholder
            # Ideally, pass user_id in state for YouTube too.
        elif platform in ["instagram", "facebook"]:
            tokens = await social_oauth.exchange_meta_code(code, platform)
        elif platform == "tiktok":
            tokens = await social_oauth.exchange_tiktok_code(code)
            user_id = ObjectId(state)
        elif platform == "x":
            state_doc = await db.oauth_states.find_one({}, sort=[("_id", -1)])
            verifier = state_doc["verifier"]
            user_id = state_doc["user_id"]
            tokens = await social_oauth.exchange_x_code(code, verifier)
            await db.oauth_states.delete_one({"_id": state_doc["_id"]})
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Auth failed: {str(e)}")

    if not user_id:
        # Fallback: assuming recent user (Not ideal for production, add state handling)
        raise HTTPException(status_code=400, detail="Missing user context")

    now = datetime.now(timezone.utc)
    doc = {
        "user_id": user_id,
        "platform": platform,
        "handle": tokens.get("username", f"@{platform}_user"),
        "access_token_enc": encrypt_secret(tokens.get("access_token", "")),
        "refresh_token_enc": encrypt_secret(tokens.get("refresh_token", "")) if tokens.get("refresh_token") else None,
        "expires_at": now,
        "updated_at": now,
    }
    
    await db.social_accounts.update_one(
        {"user_id": user_id, "platform": platform},
        {"$set": doc}, upsert=True
    )
    
    return RedirectResponse(f"{settings.FRONTEND_URL}/settings?connected={platform}")

@router.delete("/{platform}", status_code=204)
async def delete_account(platform: str, user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.social_accounts.delete_one({"user_id": user["_id"], "platform": platform})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Account not found.")
    return None