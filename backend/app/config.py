from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    ENVIRONMENT: str = Field(..., env="ENVIRONMENT")
    APP_NAME: str = Field(..., env="APP_NAME")
    API_V1_PREFIX: str = Field(..., env="API_V1_PREFIX")
    FRONTEND_URL: str = Field(..., env="FRONTEND_URL")
    BACKEND_URL: str = Field(..., env="BACKEND_URL")
    ALLOWED_ORIGINS: str = Field(..., env="ALLOWED_ORIGINS")

    # MongoDB
    MONGODB_URL: str = Field(..., env="MONGODB_URL")
    MONGODB_DB_NAME: str = Field(..., env="MONGODB_DB_NAME")

    # JWT
    JWT_SECRET_KEY: str = Field(..., env="JWT_SECRET_KEY")
    JWT_ALGORITHM: str = Field(..., env="JWT_ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(..., env="ACCESS_TOKEN_EXPIRE_MINUTES")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(..., env="REFRESH_TOKEN_EXPIRE_DAYS")
    OAUTH_STATE_EXPIRE_MINUTES: int = Field(..., env="OAUTH_STATE_EXPIRE_MINUTES")

    # Admin
    ADMIN_EMAIL: str = Field(..., env="ADMIN_EMAIL")
    ADMIN_PASSWORD: str = Field(..., env="ADMIN_PASSWORD")

    # Google OAuth
    GOOGLE_CLIENT_ID: str = Field(..., env="GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str = Field(..., env="GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI: str = Field(..., env="GOOGLE_REDIRECT_URI")
    GOOGLE_SCOPES: list[str] = [
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/userinfo.email",
        "openid",
    ]

    # Encryption
    TOKEN_ENCRYPTION_KEY: str = Field(..., env="TOKEN_ENCRYPTION_KEY")

    # Paystack
    PAYSTACK_SECRET_KEY: str = Field(..., env="PAYSTACK_SECRET_KEY")
    PAYSTACK_PUBLIC_KEY: str = Field(..., env="PAYSTACK_PUBLIC_KEY")
    PAYSTACK_BASE_URL: str = Field(..., env="PAYSTACK_BASE_URL")
    PAYSTACK_CURRENCY: str = Field(..., env="PAYSTACK_CURRENCY")

    # Storage
    STORAGE_DIR: str = Field(..., env="STORAGE_DIR")
    MAX_AVATAR_BYTES: int = Field(..., env="MAX_AVATAR_BYTES")
    MAX_CHAT_FILE_BYTES: int = Field(..., env="MAX_CHAT_FILE_BYTES")
    MAX_DRIVE_UPLOAD_BYTES: int = Field(..., env="MAX_DRIVE_UPLOAD_BYTES")

    # Subscription
    TRIAL_DAYS: int = Field(..., env="TRIAL_DAYS")
    SUBSCRIPTION_PERIOD_DAYS: int = Field(..., env="SUBSCRIPTION_PERIOD_DAYS")

    # Email
    SMTP_HOST: str = Field(..., env="SMTP_HOST")
    SMTP_PORT: int = Field(..., env="SMTP_PORT")
    SMTP_USERNAME: str = Field(..., env="SMTP_USERNAME")
    SMTP_PASSWORD: str = Field(..., env="SMTP_PASSWORD")
    SMTP_FROM_EMAIL: str = Field(..., env="SMTP_FROM_EMAIL")
    SMTP_FROM_NAME: str = Field(..., env="SMTP_FROM_NAME")
    SMTP_USE_TLS: bool = Field(..., env="SMTP_USE_TLS")

    # Rate limits
    RATE_LIMIT_AUTH: str = Field(..., env="RATE_LIMIT_AUTH")
    RATE_LIMIT_PAYMENT: str = Field(..., env="RATE_LIMIT_PAYMENT")
    RATE_LIMIT_DEFAULT: str = Field(..., env="RATE_LIMIT_DEFAULT")

    # Housekeeping
    ORPHAN_UPLOAD_MAX_AGE_DAYS: int = Field(..., env="ORPHAN_UPLOAD_MAX_AGE_DAYS")

    # Social API Keys (Optional for now, uses Mock if empty)
    X_API_KEY: str = Field("", env="X_API_KEY")
    X_API_SECRET: str = Field("", env="X_API_SECRET")
    META_APP_ID: str = Field("", env="META_APP_ID")
    META_APP_SECRET: str = Field("", env="META_APP_SECRET")

    # Social Integrations
    YOUTUBE_CLIENT_ID: str = Field(..., env="YOUTUBE_CLIENT_ID")
    YOUTUBE_CLIENT_SECRET: str = Field(..., env="YOUTUBE_CLIENT_SECRET")

    META_APP_ID: str = Field(..., env="META_APP_ID")
    META_APP_SECRET: str = Field(..., env="META_APP_SECRET")

    TIKTOK_CLIENT_KEY: str = Field(..., env="TIKTOK_CLIENT_KEY")
    TIKTOK_CLIENT_SECRET: str = Field(..., env="TIKTOK_CLIENT_SECRET")

    X_CLIENT_ID: str = Field(..., env="X_CLIENT_ID")
    X_CLIENT_SECRET: str = Field(..., env="X_CLIENT_SECRET")

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()