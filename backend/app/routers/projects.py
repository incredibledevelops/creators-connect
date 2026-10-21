from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.dependencies import get_current_user, require_active_subscription
from app.schemas.project import (
    ProjectCreate, ProjectFileAdd, ProjectMemberAdd, ProjectUpdate,
)
from app.utils.serializers import doc_to_dict, serialize_user

router = APIRouter()


def _oid(value: str, label: str = "id") -> ObjectId:
    try:
        return ObjectId(value)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid {label}.")


async def _get_project_for_user(project_id: str, user_id: ObjectId) -> dict:
    db = get_db()
    project = await db.projects.find_one({"_id": _oid(project_id, "project id")})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    allowed = project["owner_id"] == user_id or any(
        m["user_id"] == user_id for m in project.get("members", [])
    )
    if not allowed:
        raise HTTPException(status_code=403, detail="You don't have access to this project.")
    return project


@router.get("")
async def list_projects(user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.projects.find({
        "$or": [
            {"owner_id": user["_id"]},
            {"members.user_id": user["_id"]},
        ]
    }).sort("updated_at", -1)
    docs = await cursor.to_list(length=200)
    return {"projects": [doc_to_dict(d) for d in docs]}


@router.post("", status_code=201)
async def create_project(
    payload: ProjectCreate,
    user: dict = Depends(require_active_subscription),
):
    db = get_db()
    now = datetime.now(timezone.utc)
    doc = {
        "name": payload.name.strip(),
        "description": (payload.description or "").strip(),
        "cover_color": payload.cover_color or "brand",
        "tags": payload.tags or [],
        "owner_id": user["_id"],
        "members": [],
        "files": [],
        "status": "draft",
        "created_at": now,
        "updated_at": now,
    }
    result = await db.projects.insert_one(doc)
    doc["_id"] = result.inserted_id

    # Auto-create project chat room
    convo = {
        "type": "project",
        "name": doc["name"],
        "project_id": result.inserted_id,
        "participant_ids": [user["_id"]],
        "created_by": user["_id"],
        "last_message_at": now,
        "created_at": now,
    }
    await db.conversations.insert_one(convo)

    return {"project": doc_to_dict(doc)}


@router.get("/{project_id}")
async def get_project(project_id: str, user: dict = Depends(get_current_user)):
    project = await _get_project_for_user(project_id, user["_id"])
    db = get_db()

    # Enrich with member profiles
    member_ids = [m["user_id"] for m in project.get("members", [])] + [project["owner_id"]]
    members_cursor = db.users.find({"_id": {"$in": member_ids}})
    member_docs = await members_cursor.to_list(length=50)
    member_map = {str(u["_id"]): serialize_user(u) for u in member_docs}

    data = doc_to_dict(project)
    data["owner"] = member_map.get(str(project["owner_id"]))
    data["member_profiles"] = [
        {**member_map.get(str(m["user_id"]), {}), "role": m.get("role", "editor")}
        for m in project.get("members", [])
    ]
    return {"project": data}


@router.patch("/{project_id}")
async def update_project(project_id: str, payload: ProjectUpdate, user: dict = Depends(get_current_user)):
    project = await _get_project_for_user(project_id, user["_id"])
    if project["owner_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Only the owner can edit this project.")

    db = get_db()
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not update:
        return {"project": doc_to_dict(project)}
    update["updated_at"] = datetime.now(timezone.utc)
    await db.projects.update_one({"_id": project["_id"]}, {"$set": update})
    fresh = await db.projects.find_one({"_id": project["_id"]})
    return {"project": doc_to_dict(fresh)}


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: str, user: dict = Depends(get_current_user)):
    project = await _get_project_for_user(project_id, user["_id"])
    if project["owner_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Only the owner can delete this project.")
    db = get_db()
    await db.projects.delete_one({"_id": project["_id"]})
    await db.conversations.delete_many({"project_id": project["_id"]})
    return None


@router.post("/{project_id}/members", status_code=201)
async def add_member(project_id: str, payload: ProjectMemberAdd, user: dict = Depends(get_current_user)):
    project = await _get_project_for_user(project_id, user["_id"])
    if project["owner_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Only the owner can add members.")

    db = get_db()
    member_oid = _oid(payload.user_id, "user id")
    member = await db.users.find_one({"_id": member_oid})
    if not member:
        raise HTTPException(status_code=404, detail="User not found.")

    if member_oid == project["owner_id"] or any(m["user_id"] == member_oid for m in project.get("members", [])):
        return {"project": doc_to_dict(project)}

    await db.projects.update_one(
        {"_id": project["_id"]},
        {"$push": {"members": {
            "user_id": member_oid,
            "role": payload.role,
            "joined_at": datetime.now(timezone.utc),
        }},
         "$set": {"updated_at": datetime.now(timezone.utc)}},
    )
    # Add to project chat
    await db.conversations.update_many(
        {"project_id": project["_id"]},
        {"$addToSet": {"participant_ids": member_oid}},
    )
    fresh = await db.projects.find_one({"_id": project["_id"]})
    return {"project": doc_to_dict(fresh)}


@router.delete("/{project_id}/members/{member_user_id}", status_code=204)
async def remove_member(project_id: str, member_user_id: str, user: dict = Depends(get_current_user)):
    project = await _get_project_for_user(project_id, user["_id"])
    if project["owner_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Only the owner can remove members.")

    db = get_db()
    member_oid = _oid(member_user_id, "user id")
    await db.projects.update_one(
        {"_id": project["_id"]},
        {"$pull": {"members": {"user_id": member_oid}},
         "$set": {"updated_at": datetime.now(timezone.utc)}},
    )
    await db.conversations.update_many(
        {"project_id": project["_id"]},
        {"$pull": {"participant_ids": member_oid}},
    )
    return None


@router.post("/{project_id}/files", status_code=201)
async def add_project_file(project_id: str, payload: ProjectFileAdd, user: dict = Depends(get_current_user)):
    project = await _get_project_for_user(project_id, user["_id"])
    db = get_db()

    file_doc = {
        "drive_file_id": payload.drive_file_id,
        "name": payload.name,
        "mime_type": payload.mime_type,
        "size": payload.size,
        "web_view_link": payload.web_view_link,
        "uploaded_by": user["_id"],
        "uploaded_at": datetime.now(timezone.utc),
    }
    await db.projects.update_one(
        {"_id": project["_id"]},
        {"$push": {"files": file_doc},
         "$set": {"updated_at": datetime.now(timezone.utc)}},
    )
    return {"file": {**file_doc, "uploaded_by": str(user["_id"]), "uploaded_at": file_doc["uploaded_at"].isoformat()}}


@router.delete("/{project_id}/files/{drive_file_id}", status_code=204)
async def remove_project_file(project_id: str, drive_file_id: str, user: dict = Depends(get_current_user)):
    project = await _get_project_for_user(project_id, user["_id"])
    db = get_db()
    await db.projects.update_one(
        {"_id": project["_id"]},
        {"$pull": {"files": {"drive_file_id": drive_file_id}},
         "$set": {"updated_at": datetime.now(timezone.utc)}},
    )
    return None