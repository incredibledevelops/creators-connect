"""Publishers for scheduled posts.

Real network integrations can be swapped in per platform. The default
`publish_now` records a simulated publish and emits an activity entry so
the UI + activity feed stay coherent, while still letting you drop in
Instagram / TikTok / YouTube / X clients later.
"""
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException

from app.database import get_db
from app.utils import activity as activity_service


async def _check_account(user_id: ObjectId, platform: str) -> dict | None:
    db = get_db()
    return await db.social_accounts.find_one({"user_id": user_id, "platform": platform})


async def _simulated_publish(post: dict, platform: str, account: dict | None) -> dict:
    """Placeholder for a real platform call.

    Replace the body of this function per-platform with real API calls:
      - Instagram Graph API     → POST /{ig-user-id}/media, /media_publish
      - TikTok Content Posting  → /v2/post/publish/video/init/
      - YouTube Data API v3     → videos.insert
      - X (Twitter) API v2      → POST /2/tweets
    """
    return {
        "platform": platform,
        "ok": True,
        "external_id": f"sim_{platform}_{post['_id']}",
        "handle": (account or {}).get("handle"),
        "published_at": datetime.now(timezone.utc).isoformat(),
    }


async def publish_now(post: dict, user_id: ObjectId) -> dict:
    db = get_db()

    results = []
    for platform in post.get("platforms", []):
        account = await _check_account(user_id, platform)
        # Even without a linked account we allow "publish" in dev so the flow works.
        result = await _simulated_publish(post, platform, account)
        results.append(result)

    now = datetime.now(timezone.utc)
    await db.scheduled_posts.update_one(
        {"_id": post["_id"]},
        {"$set": {
            "status": "published",
            "published_at": now,
            "publish_results": results,
            "updated_at": now,
        }},
    )

    await activity_service.emit(
        user_id,
        kind="post_published",
        title=f"Post published to {', '.join(post.get('platforms', []))}",
        description=post.get("caption", "")[:120],
        link=f"/scheduler",
    )
    return {"published_at": now.isoformat(), "results": results}