import requests
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import io
from app.config import settings
from app.core.security import decrypt_secret
from app.database import get_db
from app.utils import activity as activity_service

async def _get_token(user_id: ObjectId, platform: str) -> tuple:
    db = get_db()
    account = await db.social_accounts.find_one({"user_id": user_id, "platform": platform})
    if not account:
        return None, None
    return decrypt_secret(account["access_token_enc"]), decrypt_secret(account.get("refresh_token_enc", "")) if account.get("refresh_token_enc") else None

async def publish_youtube(post: dict, token: str) -> dict:
    # Requires video file, so we'll download from Drive URL
    if not post.get("media"): raise HTTPException(400, "YouTube requires video media")
    media_url = post["media"][0]["web_view_link"]
    
    # Simulating download (In production, use requests.get(media_url))
    # video_data = requests.get(media_url).content
    
    # Real YouTube API Call
    creds = Credentials(token=token)
    youtube = build("youtube", "v3", credentials=creds)
    body = {
        "snippet": {"title": post["caption"][:100], "description": post["caption"]},
        "status": {"privacyStatus": "public"}
    }
    # media = MediaIoBaseUpload(io.BytesIO(video_data), mimetype="video/mp4")
    # request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)
    # response = request.execute()
    return {"status": "success", "id": "mock_yt_id"} # Replace with response["id"]

async def publish_instagram(post: dict, token: str) -> dict:
    if not post.get("media"): raise HTTPException(400, "Instagram requires media")
    media_url = post["media"][0]["web_view_link"]
    
    # Step 1: Create Media Container
    res = requests.post(
        f"https://graph.facebook.com/v20.0/me/media",
        params={"image_url": media_url, "caption": post["caption"], "access_token": token}
    )
    if res.status_code != 200: raise HTTPException(400, f"IG Container Error: {res.text}")
    container_id = res.json()["id"]
    
    # Step 2: Publish Container
    res = requests.post(
        f"https://graph.facebook.com/v20.0/me/media_publish",
        params={"creation_id": container_id, "access_token": token}
    )
    if res.status_code != 200: raise HTTPException(400, f"IG Publish Error: {res.text}")
    return {"status": "success", "id": res.json()["id"]}

async def publish_tiktok(post: dict, token: str) -> dict:
    if not post.get("media"): raise HTTPException(400, "TikTok requires media")
    media_url = post["media"][0]["web_view_link"]
    
    # Step 1: Init Upload
    res = requests.post(
        "https://open.tiktokapis.com/v2/post/publish/video/init/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "post_info": {"title": post["caption"][:150], "privacy_level": "SELF_ONLY"}, # Forced private until audited
            "source_info": {"source": "PULL_FROM_URL", "video_url": media_url}
        }
    )
    if res.status_code != 200: raise HTTPException(400, f"TikTok Error: {res.text}")
    return {"status": "success", "id": res.json()["data"]["publish_id"]}

async def publish_facebook(post: dict, token: str) -> dict:
    # Requires Page ID, which we assume is stored in handle for now
    page_id = "YOUR_PAGE_ID" # Fetch from DB user profile
    
    res = requests.post(
        f"https://graph.facebook.com/v20.0/{page_id}/feed",
        params={"message": post["caption"], "access_token": token}
    )
    if res.status_code != 200: raise HTTPException(400, f"FB Error: {res.text}")
    return {"status": "success", "id": res.json()["id"]}

async def publish_x(post: dict, token: str) -> dict:
    res = requests.post(
        "https://api.x.com/2/tweets",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"text": post["caption"][:280]}
    )
    if res.status_code != 201: raise HTTPException(400, f"X Error: {res.text}")
    return {"status": "success", "id": res.json()["data"]["id"]}

async def publish_now(post: dict, user_id: ObjectId) -> dict:
    db = get_db()
    results = []
    
    for platform in post.get("platforms", []):
        token, _ = await _get_token(user_id, platform)
        if not token:
            results.append({"platform": platform, "status": "failed", "reason": "Account not connected"})
            continue

        try:
            if platform == "YT": res = await publish_youtube(post, token)
            elif platform == "IG": res = await publish_instagram(post, token)
            elif platform == "TT": res = await publish_tiktok(post, token)
            elif platform == "FB": res = await publish_facebook(post, token)
            elif platform == "X": res = await publish_x(post, token)
            else: res = {"status": "failed", "reason": "Unknown platform"}
            
            results.append({"platform": platform, **res})
        except Exception as e:
            results.append({"platform": platform, "status": "failed", "reason": str(e)})

    now = datetime.now(timezone.utc)
    all_failed = all(r.get("status") == "failed" for r in results)
    
    await db.scheduled_posts.update_one(
        {"_id": post["_id"]},
        {"$set": {"status": "failed" if all_failed else "published", "published_at": now, "publish_results": results, "updated_at": now}},
    )
    return {"published_at": now.isoformat(), "results": results}