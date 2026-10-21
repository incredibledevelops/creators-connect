from datetime import datetime, timezone
from bson import ObjectId


def utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _jsonable(value):
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, dict):
        return {k: _jsonable(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_jsonable(v) for v in value]
    return value


def doc_to_dict(doc: dict | None, remove: list[str] | None = None) -> dict | None:
    if not doc:
        return None
    data = dict(doc)
    if "_id" in data:
        data["id"] = str(data.pop("_id"))
    for field in remove or []:
        data.pop(field, None)
    return _jsonable(data)


def serialize_user(user: dict | None) -> dict | None:
    return doc_to_dict(user, remove=["password_hash"])