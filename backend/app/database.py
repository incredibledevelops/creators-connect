from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings


class DatabaseState:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None


db_state = DatabaseState()


async def create_indexes() -> None:
    db = db_state.db
    await db.users.create_index("email", unique=True)
    await db.users.create_index("handle", unique=True, sparse=True)
    await db.refresh_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.refresh_tokens.create_index("token_hash", unique=True)
    await db.drive_connections.create_index("user_id", unique=True)
    await db.projects.create_index("owner_id")
    await db.projects.create_index("members.user_id")
    await db.conversations.create_index("participant_ids")
    await db.messages.create_index([("conversation_id", 1), ("created_at", 1)])
    await db.scheduled_posts.create_index([("user_id", 1), ("scheduled_for", 1)])
    await db.scheduled_posts.create_index([("status", 1), ("scheduled_for", 1)])
    await db.payments.create_index("reference", unique=True)
    await db.payments.create_index("user_id")


async def connect_to_mongo() -> None:
    db_state.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db_state.db = db_state.client[settings.MONGODB_DB_NAME]
    await create_indexes()
    print(f"✅ MongoDB connected → {settings.MONGODB_DB_NAME}")


async def close_mongo_connection() -> None:
    if db_state.client:
        db_state.client.close()
        print("❌ MongoDB connection closed")


def get_db() -> AsyncIOMotorDatabase:
    return db_state.db