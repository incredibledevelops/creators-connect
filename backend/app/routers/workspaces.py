from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.workspace import WorkspaceMemberAdd, WorkspaceRename
from app.utils import activity as activity_service
from app.utils.plans import get_seat_limit
from app.utils.serializers import doc_to_dict, serialize_user

router = APIRouter()


def _oid(value: str, label: str = "id") -> ObjectId:
    try:
        return ObjectId(value)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid {label}.")


async def _my_workspace(user_id: ObjectId) -> dict:
    db = get_db()
    ws = await db.workspaces.find_one({"owner_id": user_id})
    if not ws:
        # Legacy accounts created before workspace model — create one now.
        now = datetime.now(timezone.utc)
        user = await db.users.find_one({"_id": user_id})
        doc = {
            "owner_id": user_id,
            "name": (user.get("full_name", "My").split(" ")[0] + "'s Studio") if user else "My Studio",
            "plan": (user or {}).get("subscription", {}).get("plan", "trial"),
            "member_ids": [user_id],
            "created_at": now,
            "updated_at": now,
        }
        res = await db.workspaces.insert_one(doc)
        doc["_id"] = res.inserted_id
        return doc
    return ws


@router.get("")
async def get_workspace(user: dict = Depends(get_current_user)):
    ws = await _my_workspace(user["_id"])
    db = get_db()

    # Enrich member profiles + seat info
    users_cursor = db.users.find({"_id": {"$in": ws["member_ids"]}})
    members = await users_cursor.to_list(length=100)
    member_map = {str(u["_id"]): serialize_user(u) for u in members}

    plan = user.get("subscription", {}).get("plan", "trial")
    seat_limit = get_seat_limit(plan) if plan != "trial" else 1
    # Trial uses Pro seat layout (5) as a courtesy while trialing
    if plan == "trial":
        seat_limit = get_seat_limit("pro")

    data = doc_to_dict(ws)
    data["owner"] = member_map.get(str(ws["owner_id"]))
    data["members"] = [member_map.get(str(mid)) for mid in ws["member_ids"] if member_map.get(str(mid))]
    data["seat_limit"] = seat_limit
    data["seats_used"] = len(ws["member_ids"])
    return {"workspace": data}


@router.patch("")
async def rename_workspace(payload: WorkspaceRename, user: dict = Depends(get_current_user)):
    ws = await _my_workspace(user["_id"])
    if ws["owner_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Only the workspace owner can rename it.")
    db = get_db()
    await db.workspaces.update_one(
        {"_id": ws["_id"]},
        {"$set": {"name": payload.name.strip(), "updated_at": datetime.now(timezone.utc)}},
    )
    return {"message": "Workspace renamed."}


@router.post("/members", status_code=201)
async def add_member(payload: WorkspaceMemberAdd, user: dict = Depends(get_current_user)):
    ws = await _my_workspace(user["_id"])
    if ws["owner_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Only the workspace owner can add members.")

    db = get_db()
    member_oid = _oid(payload.user_id, "user id")
    member = await db.users.find_one({"_id": member_oid})
    if not member:
        raise HTTPException(status_code=404, detail="User not found.")

    if member_oid in ws["member_ids"]:
        return {"message": "Already a member."}

    plan = user.get("subscription", {}).get("plan", "trial")
    seat_limit = get_seat_limit("pro") if plan == "trial" else get_seat_limit(plan)
    if len(ws["member_ids"]) >= seat_limit:
        raise HTTPException(
            status_code=403,
            detail=f"Your plan allows {seat_limit} seat(s). Upgrade to add more people.",
        )

    now = datetime.now(timezone.utc)
    await db.workspaces.update_one(
        {"_id": ws["_id"]},
        {"$addToSet": {"member_ids": member_oid}, "$set": {"updated_at": now}},
    )
    await activity_service.emit(
        user["_id"], kind="member_added",
        title=f"{member.get('full_name', 'Member')} joined the workspace",
    )
    await activity_service.emit(
        member_oid, kind="joined_workspace",
        title=f"You joined {ws.get('name', 'a workspace')}",
    )
    return {"message": "Member added."}


@router.delete("/members/{member_user_id}", status_code=204)
async def remove_member(member_user_id: str, user: dict = Depends(get_current_user)):
    ws = await _my_workspace(user["_id"])
    if ws["owner_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Only the workspace owner can remove members.")
    member_oid = _oid(member_user_id, "user id")
    if member_oid == ws["owner_id"]:
        raise HTTPException(status_code=400, detail="You cannot remove the workspace owner.")
    await get_db().workspaces.update_one(
        {"_id": ws["_id"]},
        {"$pull": {"member_ids": member_oid},
         "$set": {"updated_at": datetime.now(timezone.utc)}},
    )
    return None