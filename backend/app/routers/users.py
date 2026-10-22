from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.user import UserUpdate
from app.services.storage import save_avatar
from app.utils.serializers import serialize_user

router = APIRouter()


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"user": serialize_user(user)}


@router.patch("/me")
async def update_me(payload: UserUpdate, user: dict = Depends(get_current_user)):
    db = get_db()
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}

    if "handle" in update:
        update["handle"] = update["handle"].lower()
        clash = await db.users.find_one({
            "handle": update["handle"], "_id": {"$ne": user["_id"]}
        })
        if clash:
            raise HTTPException(status_code=400, detail="That handle is already taken.")

    if not update:
        return {"user": serialize_user(user)}

    update["updated_at"] = datetime.now(timezone.utc)
    await db.users.update_one({"_id": user["_id"]}, {"$set": update})
    fresh = await db.users.find_one({"_id": user["_id"]})
    return {"user": serialize_user(fresh)}


@router.post("/me/avatar")
async def upload_avatar(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    db = get_db()
    url = await save_avatar(str(user["_id"]), file)
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"avatar_url": url, "updated_at": datetime.now(timezone.utc)}},
    )
    return {"avatar_url": url}


@router.get("/{user_id}")
async def get_public_profile(user_id: str, _: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id.")
    db = get_db()
    user = await db.users.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"user": {
        "id": str(user["_id"]),
        "full_name": user.get("full_name"),
        "handle": user.get("handle"),
        "bio": user.get("bio"),
        "avatar_url": user.get("avatar_url"),
    }}