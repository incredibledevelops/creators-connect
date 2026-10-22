from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import settings


class DatabaseState:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None


db_state = DatabaseState()


async def create_indexes() -> None:
    db = db_state.db
    assert db is not None

    # Auth / users
    await db.users.create_index("email", unique=True)
    await db.users.create_index("handle", unique=True, sparse=True)
    await db.password_resets.create_index("token_hash", unique=True)
    await db.password_resets.create_index("expires_at", expireAfterSeconds=0)
    await db.email_verifications.create_index("token_hash", unique=True)
    await db.email_verifications.create_index("expires_at", expireAfterSeconds=0)
    await db.refresh_tokens.create_index("token_hash", unique=True)
    await db.refresh_tokens.create_index("expires_at", expireAfterSeconds=0)

    # Workspaces (seat model)
    await db.workspaces.create_index("owner_id", unique=True)
    await db.workspaces.create_index("member_ids")

    # Projects
    await db.projects.create_index("workspace_id")
    await db.projects.create_index("owner_id")
    await db.projects.create_index("members.user_id")
    await db.projects.create_index([("created_at", -1)])

    # Chat
    await db.conversations.create_index("participant_ids")
    await db.conversations.create_index([("last_message_at", -1)])
    await db.messages.create_index([("conversation_id", 1), ("_id", -1)])
    await db.chat_reads.create_index(
        [("conversation_id", 1), ("user_id", 1)], unique=True
    )

    # Schedule
    await db.scheduled_posts.create_index([("user_id", 1), ("scheduled_for", 1)])
    await db.scheduled_posts.create_index([("status", 1), ("scheduled_for", 1)])
    await db.scheduled_posts.create_index([("created_at", -1)])

    # Social accounts
    await db.social_accounts.create_index(
        [("user_id", 1), ("platform", 1)], unique=True
    )

    # Payments
    await db.payments.create_index("reference", unique=True)
    await db.payments.create_index([("user_id", 1), ("created_at", -1)])

    # Drive
    await db.drive_connections.create_index("user_id", unique=True)

    # Activity feed
    await db.activity.create_index([("user_id", 1), ("created_at", -1)])


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
    assert db_state.db is not None, "DB not initialised"
    return db_state.db

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

class DatabaseState:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None

db_state = DatabaseState()

async def create_indexes() -> None:
    db = db_state.db
    assert db is not None

    await db.users.create_index("email", unique=True)
    await db.users.create_index("handle", unique=True, sparse=True)
    await db.users.create_index("role") # for admin
    await db.password_resets.create_index("token_hash", unique=True)
    await db.password_resets.create_index("expires_at", expireAfterSeconds=0)
    await db.email_verifications.create_index("token_hash", unique=True)
    await db.email_verifications.create_index("expires_at", expireAfterSeconds=0)
    await db.refresh_tokens.create_index("token_hash", unique=True)
    await db.refresh_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.workspaces.create_index("owner_id", unique=True)
    await db.workspaces.create_index("member_ids")
    await db.workspace_invites.create_index("token", unique=True)
    await db.workspace_invites.create_index("expires_at", expireAfterSeconds=0)
    await db.projects.create_index("workspace_id")
    await db.projects.create_index("owner_id")
    await db.conversations.create_index("participant_ids")
    await db.messages.create_index([("conversation_id", 1), ("_id", -1)])
    await db.chat_reads.create_index([("conversation_id", 1), ("user_id", 1)], unique=True)
    await db.scheduled_posts.create_index([("user_id", 1), ("scheduled_for", 1)])
    await db.scheduled_posts.create_index([("status", 1), ("scheduled_for", 1)])
    await db.social_accounts.create_index([("user_id", 1), ("platform", 1)], unique=True)
    await db.payments.create_index("reference", unique=True)
    await db.drive_connections.create_index("user_id", unique=True)
    await db.activity.create_index([("user_id", 1), ("created_at", -1)])

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
    assert db_state.db is not None, "DB not initialised"
    return db_state.db