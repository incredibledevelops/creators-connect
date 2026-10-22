"""Background jobs:
   - Publish due scheduled posts.
   - Expire trials & subscriptions.
   - Trim activity feed.
   - Clean orphan local uploads.
"""
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.config import settings
from app.database import get_db
from app.services.publisher import publish_now

scheduler = AsyncIOScheduler(timezone="UTC")


async def process_due_posts() -> None:
    db = get_db()
    now = datetime.now(timezone.utc)
    cursor = db.scheduled_posts.find(
        {"status": "queued", "scheduled_for": {"$lte": now}}, limit=50
    )
    async for post in cursor:
        try:
            await publish_now(post, post["user_id"])
        except Exception as e:
            await db.scheduled_posts.update_one(
                {"_id": post["_id"]},
                {"$set": {
                    "status": "failed",
                    "failure_reason": str(e)[:300],
                    "updated_at": now,
                }},
            )


async def expire_subscriptions() -> None:
    db = get_db()
    now = datetime.now(timezone.utc)
    await db.users.update_many(
        {"subscription.status": "trialing",
         "subscription.trial_ends_at": {"$lte": now}},
        {"$set": {"subscription.status": "expired", "updated_at": now}},
    )
    await db.users.update_many(
        {"subscription.status": "active",
         "subscription.current_period_end": {"$lte": now}},
        {"$set": {"subscription.status": "expired", "updated_at": now}},
    )


async def trim_activity() -> None:
    db = get_db()
    # Per user, keep the latest 2000 activity items
    user_ids = await db.activity.distinct("user_id")
    for uid in user_ids:
        ids = await db.activity.find({"user_id": uid}) \
            .sort("created_at", -1).skip(2000).to_list(1000)
        if ids:
            await db.activity.delete_many({"_id": {"$in": [d["_id"] for d in ids]}})


async def cleanup_orphan_uploads() -> None:
    """Delete local chat uploads older than N days (avatars are kept)."""
    cutoff = time.time() - settings.ORPHAN_UPLOAD_MAX_AGE_DAYS * 86400
    chat_dir = Path(settings.STORAGE_DIR) / "chat"
    if not chat_dir.exists():
        return
    for p in chat_dir.iterdir():
        if p.is_file() and p.stat().st_mtime < cutoff:
            try:
                p.unlink()
            except OSError:
                pass


def start_scheduler() -> None:
    if scheduler.running:
        return
    scheduler.add_job(process_due_posts, "interval", minutes=1, id="due_posts", replace_existing=True)
    scheduler.add_job(expire_subscriptions, "interval", hours=1, id="expire_subs", replace_existing=True)
    scheduler.add_job(trim_activity, "cron", hour=3, minute=0, id="trim_activity", replace_existing=True)
    scheduler.add_job(cleanup_orphan_uploads, "cron", hour=4, minute=0, id="cleanup_orphans", replace_existing=True)
    scheduler.start()
    print("⏰ Scheduler started")


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)