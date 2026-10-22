import secrets
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.workspace import WorkspaceMemberAdd, WorkspaceRename, WorkspaceInvite
from app.services import email as email_service
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

    users_cursor = db.users.find({"_id": {"$in": ws["member_ids"]}})
    members = await users_cursor.to_list(length=100)
    member_map = {str(u["_id"]): serialize_user(u) for u in members}

    plan = user.get("subscription", {}).get("plan", "trial")
    seat_limit = get_seat_limit(plan) if plan != "trial" else get_seat_limit("pro")
    if plan == "trial":
        seat_limit = get_seat_limit("pro")

    data = doc_to_dict(ws)
    data["owner"] = member_map.get(str(ws["owner_id"]))
    data["members"] = [member_map.get(str(mid)) for mid in ws["member_ids"] if member_map.get(str(mid))]
    data["seat_limit"] = seat_limit
    data["seats_used"] = len(ws["member_ids"])
    
    # Get pending invites
    invites_cursor = db.workspace_invites.find({"workspace_id": ws["_id"], "status": "pending"})
    invites = await invites_cursor.to_list(10)
    data["pending_invites"] = [doc_to_dict(i) for i in invites]

    return {"workspace": data}

@router.post("/invite", status_code=201)
async def invite_member(payload: WorkspaceInvite, user: dict = Depends(get_current_user)):
    ws = await _my_workspace(user["_id"])
    if ws["owner_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Only the workspace owner can invite members.")

    db = get_db()
    
    # Check if user is already in the workspace
    existing_user = await db.users.find_one({"email": payload.email.lower()})
    if existing_user and existing_user["_id"] in ws["member_ids"]:
        raise HTTPException(status_code=400, detail="This user is already a member.")

    # Check seat limits
    plan = user.get("subscription", {}).get("plan", "trial")
    seat_limit = get_seat_limit("pro") if plan == "trial" else get_seat_limit(plan)
    
    pending_count = await db.workspace_invites.count_documents({"workspace_id": ws["_id"], "status": "pending"})
    if (len(ws["member_ids"]) + pending_count) >= seat_limit:
        raise HTTPException(
            status_code=403,
            detail=f"Your plan allows {seat_limit} seat(s). Upgrade to add more people.",
        )

    # Create invite token
    now = datetime.now(timezone.utc)
    token = secrets.token_urlsafe(32)
    invite_doc = {
        "workspace_id": ws["_id"],
        "email": payload.email.lower(),
        "role": payload.role,
        "token": token,
        "status": "pending",
        "expires_at": now + timedelta(days=7),
        "created_at": now
    }
    await db.workspace_invites.insert_one(invite_doc)

    # Send email
    link = f"{settings.FRONTEND_URL}/join?token={token}"
    subject = f"Invitation to join {ws['name']}"
    html = f"""
    <p>You have been invited to join <strong>{ws['name']}</strong> on Creators Connect.</p>
    <p><a href="{link}">Click here to accept the invitation</a></p>
    """
    try:
        await email_service.send_email(payload.email, subject, html)
    except Exception as e:
        print(f"[email] invite failed: {e}")

    return {"message": "Invitation sent.", "invite": doc_to_dict(invite_doc)}

@router.get("/accept-invite/{token}")
async def accept_invite(token: str, user: dict = Depends(get_current_user)):
    db = get_db()
    invite = await db.workspace_invites.find_one({"token": token, "status": "pending"})
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found or expired.")
    if invite["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invite has expired.")
    if invite["email"] != user["email"]:
        raise HTTPException(status_code=403, detail="This invite was sent to a different email address.")

    ws = await db.workspaces.find_one({"_id": invite["workspace_id"]})
    
    # Add to workspace
    await db.workspaces.update_one(
        {"_id": ws["_id"]},
        {"$addToSet": {"member_ids": user["_id"]}, "$set": {"updated_at": datetime.now(timezone.utc)}}
    )
    # Mark invite accepted
    await db.workspace_invites.update_one(
        {"_id": invite["_id"]},
        {"$set": {"status": "accepted"}}
    )
    
    await activity_service.emit(
        user["_id"], kind="joined_workspace",
        title=f"You joined {ws['name']}",
    )
    
    return {"message": "Successfully joined workspace.", "workspace_id": str(ws["_id"])}

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