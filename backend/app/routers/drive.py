from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import RedirectResponse

from app.config import settings
from app.core.security import create_access_token, decode_token
from app.database import get_db
from app.dependencies import get_current_user
from app.services import google_drive as drive_service

router = APIRouter()


def _oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id.")


@router.get("/connect")
async def connect_drive(user: dict = Depends(get_current_user)):
    """Return the Google authorization URL the frontend should open."""
    state = create_access_token(str(user["_id"]), expires_delta=timedelta(minutes=10))
    url = drive_service.build_auth_url(state=state)
    return {"authorization_url": url}


@router.get("/oauth/callback")
async def drive_callback(code: str, state: str):
    """Google redirects here. We exchange the code and store the tokens."""
    try:
        payload = decode_token(state)
        user_id = ObjectId(payload["sub"])
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid OAuth state.")

    try:
        creds = drive_service.exchange_code(code)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not exchange code: {e}")

    if not creds.refresh_token:
        # Try to prompt again with consent to force a refresh_token
        raise HTTPException(
            status_code=400,
            detail="Google did not return a refresh token. Please re-authorise.",
        )

    await drive_service.store_connection(user_id, creds)
    return RedirectResponse(f"{settings.FRONTEND_URL}/settings?drive=connected")


@router.get("/status")
async def drive_status(user: dict = Depends(get_current_user)):
    conn = await drive_service.get_connection(user["_id"])
    if not conn:
        return {"connected": False}
    return {
        "connected": True,
        "google_email": conn.get("google_email"),
        "folder_id": conn.get("folder_id"),
        "connected_at": conn.get("connected_at"),
    }


@router.post("/disconnect")
async def drive_disconnect(user: dict = Depends(get_current_user)):
    await drive_service.disconnect(user["_id"])
    return {"message": "Google Drive disconnected."}


@router.post("/upload", status_code=201)
async def drive_upload(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file.")
    result = await drive_service.upload_file(
        user_id=user["_id"],
        file_bytes=content,
        filename=file.filename,
        mime_type=file.content_type or "application/octet-stream",
    )
    return {"file": result}


@router.get("/files")
async def drive_files(user: dict = Depends(get_current_user)):
    files = await drive_service.list_files(user["_id"])
    return {"files": files}


@router.delete("/files/{file_id}", status_code=204)
async def drive_delete_file(file_id: str, user: dict = Depends(get_current_user)):
    await drive_service.delete_file(user["_id"], file_id)
    return None