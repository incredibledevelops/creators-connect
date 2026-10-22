from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.database import get_db
from app.dependencies import get_current_user
from app.utils.pagination import build_page
from app.utils.serializers import doc_to_dict, utc

router = APIRouter()


@router.get("/summary")
async def dashboard_summary(user: dict = Depends(get_current_user)):
    db = get_db()
    now = datetime.now(timezone.utc)

    projects_count = await db.projects.count_documents({
        "$or": [{"owner_id": user["_id"]}, {"members.user_id": user["_id"]}]
    })
    scheduled_total = await db.scheduled_posts.count_documents({"user_id": user["_id"]})
    upcoming = await db.scheduled_posts.find({
        "user_id": user["_id"], "status": "queued",
        "scheduled_for": {"$gte": now},
    }).sort("scheduled_for", 1).limit(5).to_list(5)

    ws = await db.workspaces.find_one({"owner_id": user["_id"]})
    collaborators = len((ws or {}).get("member_ids", [user["_id"]]))

    drive = await db.drive_connections.find_one({"user_id": user["_id"]})

    sub = user.get("subscription", {})
    return {
        "stats": {
            "projects": projects_count,
            "scheduled_posts": scheduled_total,
            "upcoming_posts": len(upcoming),
            "collaborators": collaborators,
            "drive_connected": bool(drive),
        },
        "subscription": {
            "plan": sub.get("plan"),
            "status": sub.get("status"),
            "trial_ends_at": sub.get("trial_ends_at"),
            "current_period_end": sub.get("current_period_end"),
        },
        "upcoming": [doc_to_dict(d) for d in upcoming],
    }


@router.get("/activity")
async def dashboard_activity(
    limit: int = 10,
    user: dict = Depends(get_current_user),
):
    db = get_db()
    docs = await db.activity.find({"user_id": user["_id"]}) \
        .sort("_id", -1).limit(max(1, min(limit, 50))).to_list(50)
    return {"activity": [doc_to_dict(d) for d in docs]}