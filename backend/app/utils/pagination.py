from bson import ObjectId
from fastapi import HTTPException


def parse_cursor(cursor: str | None) -> ObjectId | None:
    if not cursor:
        return None
    try:
        return ObjectId(cursor)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid cursor.")


def build_page(docs: list[dict], limit: int) -> dict:
    """docs must be ordered newest-first. Returns items + next_cursor."""
    has_more = len(docs) > limit
    page = docs[:limit]
    next_cursor = str(page[-1]["_id"]) if has_more and page else None
    return {"items": page, "next_cursor": next_cursor, "has_more": has_more}