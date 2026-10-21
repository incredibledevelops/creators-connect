"""Background jobs:
   - Publish due scheduled posts (mark them).
   - Expire trials & subscriptions.
"""
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.database import get_db

scheduler = AsyncIOScheduler(timezone="UTC")


async def process_due_posts() -> None:
    db = get_db()
    now = datetime.now(timezone.utc)

    # Grab due posts
    cursor = db.scheduled_posts.find(
        {"status": "queued", "scheduled_for": {"$lte": now}},
        limit=50,
    )
    due = await cursor.to_list(length=50)

    for post in due:
        # In a full build you'd actually push to the social platform here
        # using the user's connected account tokens.
        await db.scheduled_posts.update_one(
            {"_id": post["_id"]},
            {"$set": {
                "status": "published",
                "published_at": now,
                "updated_at": now,
            }},
        )


async def expire_subscriptions() -> None:
    db = get_db()
    now = datetime.now(timezone.utc)

    # Trialing users whose trial ended
    await db.users.update_many(
        {
            "subscription.status": "trialing",
            "subscription.trial_ends_at": {"$lte": now},
        },
        {"$set": {"subscription.status": "expired", "updated_at": now}},
    )

    # Active subscribers whose 30-day period ended
    await db.users.update_many(
        {
            "subscription.status": "active",
            "subscription.current_period_end": {"$lte": now},
        },
        {"$set": {"subscription.status": "expired", "updated_at": now}},
    )


def start_scheduler() -> None:
    if scheduler.running:
        return
    scheduler.add_job(process_due_posts, "interval", minutes=1, id="due_posts", replace_existing=True)
    scheduler.add_job(expire_subscriptions, "interval", hours=1, id="expire_subs", replace_existing=True)
    scheduler.start()
    print("⏰ Scheduler started")


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)