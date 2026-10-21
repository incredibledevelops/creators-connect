from pydantic import BaseModel, Field
from typing import Optional


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=80)
    handle: Optional[str] = Field(default=None, min_length=2, max_length=30, pattern=r"^[a-zA-Z0-9_.]+$")
    bio: Optional[str] = Field(default=None, max_length=300)