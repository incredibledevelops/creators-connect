from fastapi import APIRouter, Depends, Query

from app.database import get_db
from app.dependencies import get_current_user
from app.utils.pagination import build_page, parse_cursor
from app.utils.serializers import doc_to_dict

router = APIRouter()


@router.get("")
async def list_activity(
    limit: int = Query(default=30, ge=1, le=100),
    cursor: str | None = Query(default=None),
    user: dict = Depends(get_current_user),
):
    db = get_db()
    query: dict = {"user_id": user["_id"]}
    cur_oid = parse_cursor(cursor)
    if cur_oid:
        query["_id"] = {"$lt": cur_oid}
    docs = await db.activity.find(query).sort("_id", -1).limit(limit + 1).to_list(limit + 1)
    page = build_page(docs, limit)
    return {
        "activity": [doc_to_dict(d) for d in page["items"]],
        "next_cursor": page["next_cursor"],
        "has_more": page["has_more"],
    }