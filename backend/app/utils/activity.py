"""Emit activity-feed entries. Each write is a single small doc."""
from datetime import datetime, timezone
from bson import ObjectId

from app.database import get_db

MAX_FEED_ITEMS = 2000  # per user; older trimmed by scheduler


async def emit(
    user_id: ObjectId,
    *,
    kind: str,
    title: str,
    description: str = "",
    link: str | None = None,
    project_id: ObjectId | None = None,
) -> None:
    db = get_db()
    await db.activity.insert_one({
        "user_id": user_id,
        "kind": kind,
        "title": title,
        "description": description,
        "link": link,
        "project_id": project_id,
        "created_at": datetime.now(timezone.utc),
    })


async def emit_many(user_ids: list[ObjectId], **kwargs) -> None:
    for uid in set(user_ids):
        await emit(uid, **kwargs)