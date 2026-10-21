"""Per-user Google Drive integration.

Each user connects their own Drive via OAuth2. We store their refresh token
encrypted-at-rest in MongoDB (should be encrypted for production — see note).
User media (images/videos scheduled to socials) lives ONLY in their Drive.
"""
import asyncio
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import HTTPException
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseUpload
from google_auth_oauthlib.flow import Flow

from app.config import settings
from app.database import get_db

APP_FOLDER_NAME = "Creators Connect"


def _client_config() -> dict:
    return {
        "web": {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
        }
    }


def build_oauth_flow() -> Flow:
    flow = Flow.from_client_config(_client_config(), scopes=settings.GOOGLE_SCOPES)
    flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
    return flow


def build_auth_url(state: str) -> str:
    flow = build_oauth_flow()
    url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=state,
    )
    return url


def exchange_code(code: str) -> Credentials:
    flow = build_oauth_flow()
    flow.fetch_token(code=code)
    return flow.credentials


def _build_service(creds: Credentials):
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def _ensure_folder(service) -> str:
    """Return the app folder id in the user's drive, creating it if needed."""
    query = (
        f"name = '{APP_FOLDER_NAME}' and "
        "mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    )
    res = service.files().list(q=query, spaces="drive", fields="files(id, name)").execute()
    files = res.get("files", [])
    if files:
        return files[0]["id"]
    meta = {"name": APP_FOLDER_NAME, "mimeType": "application/vnd.google-apps.folder"}
    folder = service.files().create(body=meta, fields="id").execute()
    return folder["id"]


async def store_connection(user_id: ObjectId, creds: Credentials) -> dict:
    db = get_db()
    service = _build_service(creds)
    folder_id = await asyncio.to_thread(_ensure_folder, service)

    # Try to fetch user's email from the token
    google_email = None
    try:
        token_info = await asyncio.to_thread(
            lambda: build("oauth2", "v2", credentials=creds, cache_discovery=False)
            .userinfo().get().execute()
        )
        google_email = token_info.get("email")
    except Exception:
        pass

    now = datetime.now(timezone.utc)
    doc = {
        "user_id": user_id,
        "google_email": google_email,
        "access_token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_expiry": creds.expiry,
        "scopes": list(creds.scopes or settings.GOOGLE_SCOPES),
        "folder_id": folder_id,
        "connected_at": now,
        "updated_at": now,
    }
    await db.drive_connections.update_one(
        {"user_id": user_id}, {"$set": doc, "$setOnInsert": {"created_at": now}}, upsert=True
    )
    return doc


async def get_connection(user_id: ObjectId) -> Optional[dict]:
    db = get_db()
    return await db.drive_connections.find_one({"user_id": user_id})


async def get_service(user_id: ObjectId) -> tuple:
    """Return (service, folder_id). Refreshes token if needed."""
    conn = await get_connection(user_id)
    if not conn:
        raise HTTPException(status_code=400, detail="Google Drive not connected.")

    creds = Credentials(
        token=conn.get("access_token"),
        refresh_token=conn.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        scopes=conn.get("scopes") or settings.GOOGLE_SCOPES,
    )

    if not creds.valid:
        try:
            await asyncio.to_thread(creds.refresh, Request())
        except Exception:
            raise HTTPException(
                status_code=401,
                detail="Google Drive session expired. Please reconnect.",
            )
        db = get_db()
        await db.drive_connections.update_one(
            {"user_id": user_id},
            {"$set": {
                "access_token": creds.token,
                "token_expiry": creds.expiry,
                "updated_at": datetime.now(timezone.utc),
            }},
        )

    service = _build_service(creds)
    folder_id = conn.get("folder_id")
    if not folder_id:
        folder_id = await asyncio.to_thread(_ensure_folder, service)
        db = get_db()
        await db.drive_connections.update_one(
            {"user_id": user_id}, {"$set": {"folder_id": folder_id}}
        )
    return service, folder_id


async def upload_file(
    user_id: ObjectId,
    file_bytes: bytes,
    filename: str,
    mime_type: str,
) -> dict:
    service, folder_id = await get_service(user_id)
    import io

    media = MediaIoBaseUpload(io.BytesIO(file_bytes), mimetype=mime_type, resumable=True)
    metadata = {"name": filename, "parents": [folder_id]}

    file = await asyncio.to_thread(
        lambda: service.files()
        .create(body=metadata, media_body=media,
                fields="id, name, mimeType, size, webViewLink, webContentLink, createdTime")
        .execute()
    )
    return file


async def list_files(user_id: ObjectId) -> list[dict]:
    service, folder_id = await get_service(user_id)
    res = await asyncio.to_thread(
        lambda: service.files()
        .list(
            q=f"'{folder_id}' in parents and trashed = false",
            spaces="drive",
            orderBy="modifiedTime desc",
            fields="files(id, name, mimeType, size, webViewLink, webContentLink, modifiedTime, createdTime)",
            pageSize=100,
        )
        .execute()
    )
    return res.get("files", [])


async def delete_file(user_id: ObjectId, file_id: str) -> None:
    service, _ = await get_service(user_id)
    await asyncio.to_thread(lambda: service.files().delete(fileId=file_id).execute())


async def disconnect(user_id: ObjectId) -> None:
    db = get_db()
    await db.drive_connections.delete_one({"user_id": user_id})