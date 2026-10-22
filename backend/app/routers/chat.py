from datetime import datetime, timezone

from bson import ObjectId
from fastapi import (
    APIRouter, Depends, File, HTTPException, Query, UploadFile, WebSocket,
    WebSocketDisconnect,
)

from app.core.security import decode_token
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.chat import ConversationCreate, MessageCreate
from app.services.storage import save_chat_file
from app.utils import activity as activity_service
from app.utils.serializers import doc_to_dict, serialize_user

router = APIRouter()


class ConnectionManager:
    def __init__(self) -> None:
        self.rooms: dict[str, set[WebSocket]] = {}

    async def connect(self, ws: WebSocket, conversation_id: str) -> None:
        await ws.accept()
        self.rooms.setdefault(conversation_id, set()).add(ws)

    def disconnect(self, ws: WebSocket, conversation_id: str) -> None:
        if conversation_id in self.rooms:
            self.rooms[conversation_id].discard(ws)
            if not self.rooms[conversation_id]:
                del self.rooms[conversation_id]

    async def broadcast(self, conversation_id: str, payload: dict) -> None:
        for ws in list(self.rooms.get(conversation_id, set())):
            try:
                await ws.send_json(payload)
            except Exception:
                self.disconnect(ws, conversation_id)


manager = ConnectionManager()


def _oid(value: str, label: str = "id") -> ObjectId:
    try:
        return ObjectId(value)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid {label}.")


async def _ensure_participant(conversation_id: str, user_id: ObjectId) -> dict:
    db = get_db()
    convo = await db.conversations.find_one({"_id": _oid(conversation_id, "conversation id")})
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    if user_id not in convo.get("participant_ids", []):
        raise HTTPException(status_code=403, detail="You're not a participant in this conversation.")
    return convo


# ---------- Conversations ----------
@router.get("/conversations")
async def list_conversations(user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.conversations.find({"participant_ids": user["_id"]}).sort("last_message_at", -1)
    convos = await cursor.to_list(length=100)

    out = []
    for c in convos:
        cid = c["_id"]

        # Unread count for current user
        last_read = await db.chat_reads.find_one(
            {"conversation_id": cid, "user_id": user["_id"]}
        )
        last_read_at = last_read["last_read_at"] if last_read else datetime.fromtimestamp(0, tz=timezone.utc)
        unread = await db.messages.count_documents(
            {"conversation_id": cid, "created_at": {"$gt": last_read_at},
             "sender_id": {"$ne": user["_id"]}}
        )

        last_msg = await db.messages.find_one(
            {"conversation_id": cid}, sort=[("_id", -1)]
        )

        # Enrich participant summary for DMs
        participants_info = []
        other_ids = [pid for pid in c.get("participant_ids", []) if pid != user["_id"]]
        if other_ids:
            others = await db.users.find({"_id": {"$in": other_ids}}).to_list(20)
            participants_info = [serialize_user(u) for u in others]

        out.append({
            "id": str(cid),
            "type": c.get("type"),
            "name": c.get("name"),
            "project_id": str(c["project_id"]) if c.get("project_id") else None,
            "last_message_at": (c.get("last_message_at") or c.get("created_at")).isoformat(),
            "last_message": {
                "content": last_msg.get("content", "") if last_msg else "",
                "sender_id": str(last_msg["sender_id"]) if last_msg else None,
                "created_at": last_msg["created_at"].isoformat() if last_msg else None,
            } if last_msg else None,
            "unread_count": unread,
            "participants": participants_info,
        })
    return {"conversations": out}


@router.post("/conversations", status_code=201)
async def create_conversation(payload: ConversationCreate, user: dict = Depends(get_current_user)):
    db = get_db()
    now = datetime.now(timezone.utc)

    if payload.type == "dm":
        if not payload.participant_id:
            raise HTTPException(status_code=400, detail="participant_id is required for DMs.")
        other = _oid(payload.participant_id, "participant id")
        if other == user["_id"]:
            raise HTTPException(status_code=400, detail="You can't DM yourself.")
        if not await db.users.find_one({"_id": other}):
            raise HTTPException(status_code=404, detail="User not found.")
        existing = await db.conversations.find_one({
            "type": "dm",
            "participant_ids": {"$all": [user["_id"], other], "$size": 2},
        })
        if existing:
            return {"conversation": doc_to_dict(existing)}
        doc = {
            "type": "dm", "name": None,
            "participant_ids": [user["_id"], other],
            "created_by": user["_id"],
            "last_message_at": now, "created_at": now,
        }
        res = await db.conversations.insert_one(doc)
        doc["_id"] = res.inserted_id
        return {"conversation": doc_to_dict(doc)}

    if not payload.project_id:
        raise HTTPException(status_code=400, detail="project_id is required for project rooms.")
    project = await db.projects.find_one({"_id": _oid(payload.project_id, "project id")})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    allowed = project["owner_id"] == user["_id"] or any(
        m["user_id"] == user["_id"] for m in project.get("members", [])
    )
    if not allowed:
        raise HTTPException(status_code=403, detail="You don't have access to this project.")

    existing = await db.conversations.find_one({"type": "project", "project_id": project["_id"]})
    if existing:
        return {"conversation": doc_to_dict(existing)}

    participants = [project["owner_id"]] + [m["user_id"] for m in project.get("members", [])]
    doc = {
        "type": "project",
        "name": payload.name or project["name"],
        "project_id": project["_id"],
        "participant_ids": participants,
        "created_by": user["_id"],
        "last_message_at": now, "created_at": now,
    }
    res = await db.conversations.insert_one(doc)
    doc["_id"] = res.inserted_id
    return {"conversation": doc_to_dict(doc)}


@router.get("/conversations/{conversation_id}/unread-count")
async def unread_count(conversation_id: str, user: dict = Depends(get_current_user)):
    convo = await _ensure_participant(conversation_id, user["_id"])
    db = get_db()
    last_read = await db.chat_reads.find_one(
        {"conversation_id": convo["_id"], "user_id": user["_id"]}
    )
    last_read_at = last_read["last_read_at"] if last_read else datetime.fromtimestamp(0, tz=timezone.utc)
    count = await db.messages.count_documents({
        "conversation_id": convo["_id"],
        "created_at": {"$gt": last_read_at},
        "sender_id": {"$ne": user["_id"]},
    })
    return {"unread_count": count}


@router.post("/conversations/{conversation_id}/read")
async def mark_read(conversation_id: str, user: dict = Depends(get_current_user)):
    convo = await _ensure_participant(conversation_id, user["_id"])
    db = get_db()
    now = datetime.now(timezone.utc)
    await db.chat_reads.update_one(
        {"conversation_id": convo["_id"], "user_id": user["_id"]},
        {"$set": {"last_read_at": now}},
        upsert=True,
    )
    return {"message": "Marked as read.", "read_at": now.isoformat()}


@router.get("/conversations/{conversation_id}/messages")
async def list_messages(
    conversation_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    before: str | None = Query(default=None),
    user: dict = Depends(get_current_user),
):
    convo = await _ensure_participant(conversation_id, user["_id"])
    db = get_db()
    query: dict = {"conversation_id": convo["_id"]}
    if before:
        try:
            query["_id"] = {"$lt": ObjectId(before)}
        except Exception:
            pass
    msgs = await db.messages.find(query).sort("_id", -1).limit(limit).to_list(limit)
    msgs.reverse()

    sender_ids = list({m["sender_id"] for m in msgs})
    senders = await db.users.find({"_id": {"$in": sender_ids}}).to_list(100) if sender_ids else []
    sender_map = {str(u["_id"]): serialize_user(u) for u in senders}

    out = []
    for m in msgs:
        d = doc_to_dict(m)
        d["sender"] = sender_map.get(str(m["sender_id"]))
        out.append(d)
    return {"messages": out}


@router.post("/conversations/{conversation_id}/messages", status_code=201)
async def send_message(
    conversation_id: str,
    payload: MessageCreate,
    user: dict = Depends(get_current_user),
):
    convo = await _ensure_participant(conversation_id, user["_id"])
    if not payload.content.strip() and not payload.attachments:
        raise HTTPException(status_code=400, detail="Message must have content or attachments.")

    db = get_db()
    now = datetime.now(timezone.utc)
    doc = {
        "conversation_id": convo["_id"],
        "sender_id": user["_id"],
        "content": payload.content.strip(),
        "attachments": [a.model_dump() for a in payload.attachments],
        "created_at": now,
    }
    res = await db.messages.insert_one(doc)
    doc["_id"] = res.inserted_id
    await db.conversations.update_one(
        {"_id": convo["_id"]}, {"$set": {"last_message_at": now}}
    )
    await db.chat_reads.update_one(
        {"conversation_id": convo["_id"], "user_id": user["_id"]},
        {"$set": {"last_read_at": now}}, upsert=True,
    )

    out = doc_to_dict(doc)
    out["sender"] = serialize_user(user)
    await manager.broadcast(conversation_id, {"type": "message", "message": out})

    for pid in convo.get("participant_ids", []):
        if pid != user["_id"]:
            await activity_service.emit(
                pid, kind="new_message",
                title=f"New message in {convo.get('name') or 'your chat'}",
                description=payload.content[:120],
                link=f"/chat",
            )
    return {"message": out}


@router.post("/conversations/{conversation_id}/upload", status_code=201)
async def upload_chat_file(
    conversation_id: str,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    await _ensure_participant(conversation_id, user["_id"])
    data = await save_chat_file(conversation_id, file)
    return {"attachment": {
        "name": data["name"], "url": data["url"],
        "type": data["type"], "size": data["size"],
    }}


# ---------- WebSocket ----------
@router.websocket("/ws/{conversation_id}")
async def ws_endpoint(websocket: WebSocket, conversation_id: str, token: str = Query(...)):
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            await websocket.close(code=4401)
            return
        user_id = ObjectId(payload["sub"])
    except Exception:
        await websocket.close(code=4401)
        return

    db = get_db()
    convo = await db.conversations.find_one({"_id": _oid(conversation_id, "conversation id")})
    if not convo or user_id not in convo.get("participant_ids", []):
        await websocket.close(code=4403)
        return
    user = await db.users.find_one({"_id": user_id})
    if not user:
        await websocket.close(code=4401)
        return

    await manager.connect(websocket, conversation_id)
    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("event", "message")

            if event_type == "typing":
                await manager.broadcast(conversation_id, {
                    "type": "typing",
                    "user_id": str(user_id),
                    "name": user.get("full_name"),
                    "is_typing": bool(data.get("is_typing")),
                })
                continue

            content = (data.get("content") or "").strip()
            attachments = data.get("attachments") or []
            if not content and not attachments:
                continue

            now = datetime.now(timezone.utc)
            doc = {
                "conversation_id": convo["_id"],
                "sender_id": user_id,
                "content": content,
                "attachments": attachments,
                "created_at": now,
            }
            res = await db.messages.insert_one(doc)
            doc["_id"] = res.inserted_id
            await db.conversations.update_one(
                {"_id": convo["_id"]}, {"$set": {"last_message_at": now}}
            )
            await db.chat_reads.update_one(
                {"conversation_id": convo["_id"], "user_id": user_id},
                {"$set": {"last_read_at": now}}, upsert=True,
            )
            out = doc_to_dict(doc)
            out["sender"] = serialize_user(user)
            await manager.broadcast(conversation_id, {"type": "message", "message": out})
    except WebSocketDisconnect:
        manager.disconnect(websocket, conversation_id)
    except Exception:
        manager.disconnect(websocket, conversation_id)