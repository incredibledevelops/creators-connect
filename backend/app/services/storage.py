"""Local system-file storage (avatars, chat uploads).
User media scheduled to socials lives in the user's Google Drive."""
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.config import settings

STORAGE_ROOT = Path(settings.STORAGE_DIR).resolve()
AVATAR_DIR = STORAGE_ROOT / "avatars"
CHAT_DIR = STORAGE_ROOT / "chat"
PROJECT_DIR = STORAGE_ROOT / "projects"

for _d in (AVATAR_DIR, CHAT_DIR, PROJECT_DIR):
    _d.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_CHAT_TYPES = ALLOWED_IMAGE_TYPES | {
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "text/plain",
    "video/mp4",
    "video/quicktime",
    "audio/mpeg",
    "audio/wav",
    "audio/webm",
}


async def save_avatar(user_id: str, file: UploadFile) -> str:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Avatar must be JPEG, PNG, WEBP or GIF.")
    content = await file.read()
    if len(content) > settings.MAX_AVATAR_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"Avatar must be ≤ {settings.MAX_AVATAR_BYTES // (1024 * 1024)} MB.",
        )
    ext = Path(file.filename or "").suffix.lower() or ".jpg"
    fname = f"{user_id}_{uuid.uuid4().hex}{ext}"
    (AVATAR_DIR / fname).write_bytes(content)
    return f"/static/avatars/{fname}"


async def save_chat_file(conversation_id: str, file: UploadFile) -> dict:
    if file.content_type not in ALLOWED_CHAT_TYPES:
        raise HTTPException(status_code=400, detail="File type not allowed.")
    content = await file.read()
    if len(content) > settings.MAX_CHAT_FILE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File must be ≤ {settings.MAX_CHAT_FILE_BYTES // (1024 * 1024)} MB.",
        )
    ext = Path(file.filename or "").suffix.lower()
    stored = f"{conversation_id}_{uuid.uuid4().hex}{ext}"
    (CHAT_DIR / stored).write_bytes(content)
    return {
        "name": file.filename or stored,
        "stored_name": stored,
        "url": f"/static/chat/{stored}",
        "type": file.content_type,
        "size": len(content),
    }