from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.dependencies import get_current_user, require_active_subscription
from app.schemas.schedule import ScheduledPostCreate, ScheduledPostUpdate
from app.utils.serializers import doc_to_dict

router = APIRouter()


def _oid(value: str, label: str = "id") -> ObjectId:
    try:
        return ObjectId(value)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid {label}.")


@router.get("")
async def list_scheduled(user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.scheduled_posts.find({"user_id": user["_id"]}).sort("scheduled_for", 1)
    docs = await cursor.to_list(length=300)
    return {"posts": [doc_to_dict(d) for d in docs]}


@router.post("", status_code=201)
async def create_scheduled(
    payload: ScheduledPostCreate,
    user: dict = Depends(require_active_subscription),
):
    if payload.scheduled_for.tzinfo is None:
        scheduled_for = payload.scheduled_for.replace(tzinfo=timezone.utc)
    else:
        scheduled_for = payload.scheduled_for

    if scheduled_for <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Scheduled time must be in the future.")

    db = get_db()
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": user["_id"],
        "project_id": _oid(payload.project_id, "project id") if payload.project_id else None,
        "caption": payload.caption,
        "platforms": payload.platforms,
        "media": [m.model_dump() for m in payload.media],
        "scheduled_for": scheduled_for,
        "status": "queued",
        "published_at": None,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.scheduled_posts.insert_one(doc)
    doc["_id"] = result.inserted_id
    return {"post": doc_to_dict(doc)}


@router.patch("/{post_id}")
async def update_scheduled(
    post_id: str,
    payload: ScheduledPostUpdate,
    user: dict = Depends(get_current_user),
):
    db = get_db()
    post = await db.scheduled_posts.find_one({"_id": _oid(post_id, "post id"), "user_id": user["_id"]})
    if not post:
        raise HTTPException(status_code=404, detail="Scheduled post not found.")

    if post["status"] == "published":
        raise HTTPException(status_code=400, detail="Published posts can't be edited.")

    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not update:
        return {"post": doc_to_dict(post)}

    if "scheduled_for" in update:
        if update["scheduled_for"].tzinfo is None:
            update["scheduled_for"] = update["scheduled_for"].replace(tzinfo=timezone.utc)
        if update["scheduled_for"] <= datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Scheduled time must be in the future.")

    update["updated_at"] = datetime.now(timezone.utc)
    await db.scheduled_posts.update_one({"_id": post["_id"]}, {"$set": update})
    fresh = await db.scheduled_posts.find_one({"_id": post["_id"]})
    return {"post": doc_to_dict(fresh)}


@router.delete("/{post_id}", status_code=204)
async def delete_scheduled(post_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.scheduled_posts.delete_one(
        {"_id": _oid(post_id, "post id"), "user_id": user["_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scheduled post not found.")
    return None