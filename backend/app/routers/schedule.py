from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import get_db
from app.dependencies import get_current_user, require_active_subscription
from app.schemas.schedule import ScheduledPostCreate, ScheduledPostUpdate
from app.services.social_publisher import publish_now # CHANGED
from app.utils import activity as activity_service
from app.utils.pagination import build_page, parse_cursor
from app.utils.serializers import doc_to_dict

router = APIRouter()

def _oid(value: str, label: str = "id") -> ObjectId:
    try:
        return ObjectId(value)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid {label}.")

@router.get("")
async def list_scheduled(
    limit: int = Query(default=50, ge=1, le=200),
    cursor: str | None = Query(default=None),
    user: dict = Depends(get_current_user),
):
    db = get_db()
    query: dict = {"user_id": user["_id"]}
    cur_oid = parse_cursor(cursor)
    if cur_oid:
        query["_id"] = {"$lt": cur_oid}
    docs = await db.scheduled_posts.find(query).sort("_id", -1).limit(limit + 1).to_list(limit + 1)
    page = build_page(docs, limit)
    return {
        "posts": [doc_to_dict(d) for d in page["items"]],
        "next_cursor": page["next_cursor"],
        "has_more": page["has_more"],
    }

@router.post("", status_code=201)
async def create_scheduled(
    payload: ScheduledPostCreate,
    user: dict = Depends(require_active_subscription),
):
    scheduled_for = payload.scheduled_for
    if scheduled_for.tzinfo is None:
        scheduled_for = scheduled_for.replace(tzinfo=timezone.utc)
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
    res = await db.scheduled_posts.insert_one(doc)
    doc["_id"] = res.inserted_id

    await activity_service.emit(
        user["_id"], kind="post_scheduled",
        title=f"Post scheduled for {', '.join(payload.platforms)}",
        description=payload.caption[:120],
        link="/scheduler",
    )
    return {"post": doc_to_dict(doc)}

@router.patch("/{post_id}")
async def update_scheduled(
    post_id: str,
    payload: ScheduledPostUpdate,
    user: dict = Depends(get_current_user),
):
    db = get_db()
    post = await db.scheduled_posts.find_one(
        {"_id": _oid(post_id, "post id"), "user_id": user["_id"]}
    )
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

@router.post("/{post_id}/publish-now")
async def publish_post_now(post_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    post = await db.scheduled_posts.find_one(
        {"_id": _oid(post_id, "post id"), "user_id": user["_id"]}
    )
    if not post:
        raise HTTPException(status_code=404, detail="Scheduled post not found.")
    if post["status"] == "published":
        raise HTTPException(status_code=400, detail="Already published.")

    result = await publish_now(post, user["_id"])
    return {"message": "Published.", **result}

@router.delete("/{post_id}", status_code=204)
async def delete_scheduled(post_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.scheduled_posts.delete_one(
        {"_id": _oid(post_id, "post id"), "user_id": user["_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scheduled post not found.")
    return None