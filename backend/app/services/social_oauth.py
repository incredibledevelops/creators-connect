import base64
import hashlib
import secrets
import requests
from urllib.parse import urlencode
from fastapi import HTTPException
from app.config import settings

# 1. YOUTUBE (Google)
def get_youtube_auth_url():
    params = {
        "client_id": settings.YOUTUBE_CLIENT_ID,
        "redirect_uri": f"{settings.BACKEND_URL}/api/v1/accounts/youtube/callback",
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/youtube.upload",
        "access_type": "offline",
        "prompt": "consent"
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"

async def exchange_youtube_code(code: str):
    res = requests.post("https://oauth2.googleapis.com/token", data={
        "code": code,
        "client_id": settings.YOUTUBE_CLIENT_ID,
        "client_secret": settings.YOUTUBE_CLIENT_SECRET,
        "redirect_uri": f"{settings.BACKEND_URL}/api/v1/accounts/youtube/callback",
        "grant_type": "authorization_code"
    })
    if res.status_code != 200:
        raise HTTPException(status_code=400, detail="YouTube token exchange failed")
    return res.json()

# 2. META (Instagram & Facebook)
def get_meta_auth_url(platform: str):
    scope = "instagram_basic,instagram_content_publish,pages_read_engagement,pages_manage_posts" if platform == "instagram" else "pages_manage_posts,pages_read_engagement"
    params = {
        "client_id": settings.META_APP_ID,
        "redirect_uri": f"{settings.BACKEND_URL}/api/v1/accounts/{platform}/callback",
        "response_type": "code",
        "scope": scope
    }
    return f"https://www.facebook.com/v20.0/dialog/oauth?{urlencode(params)}"

async def exchange_meta_code(code: str, platform: str):
    res = requests.get("https://graph.facebook.com/v20.0/oauth/access_token", params={
        "client_id": settings.META_APP_ID,
        "client_secret": settings.META_APP_SECRET,
        "redirect_uri": f"{settings.BACKEND_URL}/api/v1/accounts/{platform}/callback",
        "code": code
    })
    if res.status_code != 200:
        raise HTTPException(status_code=400, detail="Meta token exchange failed")
    return res.json()

# 3. TIKTOK
def get_tiktok_auth_url(state: str):
    params = {
        "client_key": settings.TIKTOK_CLIENT_KEY,
        "redirect_uri": f"{settings.BACKEND_URL}/api/v1/accounts/tiktok/callback",
        "response_type": "code",
        "scope": "user.info.basic,video.upload,video.publish",
        "state": state
    }
    return f"https://www.tiktok.com/v2/auth/authorize/?{urlencode(params)}"

async def exchange_tiktok_code(code: str):
    res = requests.post("https://open.tiktokapis.com/v2/oauth/token/", data={
        "client_key": settings.TIKTOK_CLIENT_KEY,
        "client_secret": settings.TIKTOK_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": f"{settings.BACKEND_URL}/api/v1/accounts/tiktok/callback"
    }, headers={"Content-Type": "application/x-www-form-urlencoded"})
    if res.status_code != 200:
        raise HTTPException(status_code=400, detail="TikTok token exchange failed")
    return res.json()

# 4. X (TWITTER)
def get_x_auth_url():
    code_verifier = secrets.token_urlsafe(50)
    code_challenge = base64.urlsafe_b64encode(hashlib.sha256(code_verifier.encode()).digest()).decode().replace("=", "")
    params = {
        "response_type": "code",
        "client_id": settings.X_CLIENT_ID,
        "redirect_uri": f"{settings.BACKEND_URL}/api/v1/accounts/x/callback",
        "scope": "tweet.read tweet.write users.read offline.access",
        "state": "x_state",
        "code_challenge": code_challenge,
        "code_challenge_method": "S256"
    }
    return f"https://twitter.com/i/oauth2/authorize?{urlencode(params)}", code_verifier

async def exchange_x_code(code: str, verifier: str):
    auth_header = base64.b64encode(f"{settings.X_CLIENT_ID}:{settings.X_CLIENT_SECRET}".encode()).decode()
    res = requests.post("https://api.twitter.com/2/oauth2/token", data={
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": f"{settings.BACKEND_URL}/api/v1/accounts/x/callback",
        "code_verifier": verifier
    }, headers={"Authorization": f"Basic {auth_header}", "Content-Type": "application/x-www-form-urlencoded"})
    if res.status_code != 200:
        raise HTTPException(status_code=400, detail="X token exchange failed")
    return res.json()