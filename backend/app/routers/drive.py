from datetime import datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import RedirectResponse

from app.config import settings
from app.core.security import create_short_token, decode_token
from app.dependencies import get_current_user
from app.services import google_drive as drive_service

router = APIRouter()


@router.get("/connect")
async def connect_drive(user: dict = Depends(get_current_user)):
    state = create_short_token(
        str(user["_id"]), "drive_oauth", settings.OAUTH_STATE_EXPIRE_MINUTES
    )
    url = drive_service.build_auth_url(state=state)
    return {"authorization_url": url}


@router.get("/oauth/callback")
async def drive_callback(code: str, state: str):
    try:
        payload = decode_token(state)
        if payload.get("type") != "drive_oauth":
            raise ValueError("bad purpose")
        user_id = ObjectId(payload["sub"])
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid OAuth state.")

    try:
        creds = drive_service.exchange_code(code)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not exchange code: {e}")
    if not creds.refresh_token:
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


@router.post("/folders", status_code=201)
async def create_folder(
    name: str = Form(..., min_length=1, max_length=100),
    parent: str | None = Form(default=None),
    user: dict = Depends(get_current_user),
):
    folder = await drive_service.create_folder(user["_id"], name, parent)
    return {"folder": folder}


@router.post("/upload", status_code=201)
async def drive_upload(
    file: UploadFile = File(...),
    parent: str | None = Form(default=None),
    user: dict = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file.")
    if len(content) > settings.MAX_DRIVE_UPLOAD_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds {settings.MAX_DRIVE_UPLOAD_BYTES // (1024 * 1024)} MB limit.",
        )
    result = await drive_service.upload_file(
        user_id=user["_id"],
        file_bytes=content,
        filename=file.filename,
        mime_type=file.content_type or "application/octet-stream",
        parent_folder_id=parent,
    )
    return {"file": result}


@router.get("/files")
async def drive_files(
    parent: str | None = None,
    user: dict = Depends(get_current_user),
):
    files = await drive_service.list_files(user["_id"], parent)
    return {"files": files}


@router.delete("/files/{file_id}", status_code=204)
async def drive_delete_file(file_id: str, user: dict = Depends(get_current_user)):
    await drive_service.delete_file(user["_id"], file_id)
    return None