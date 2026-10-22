from typing import Literal
from pydantic import BaseModel, Field


PlatformLiteral = Literal["IG", "TT", "YT", "X", "FB"]


class SocialAccountCreate(BaseModel):
    platform: PlatformLiteral
    handle: str = Field(min_length=1, max_length=80)
    access_token: str = Field(min_length=1)
    refresh_token: str | None = None
    expires_at: str | None = None  # ISO string; optional