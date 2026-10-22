from typing import Literal, Optional
from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=500)
    cover_color: Optional[str] = Field(default="brand", max_length=30)
    tags: list[str] = Field(default_factory=list, max_length=10)


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=500)
    status: Optional[Literal["draft", "in_review", "approved", "archived"]] = None
    tags: Optional[list[str]] = None
    cover_color: Optional[str] = None


class ProjectMemberAdd(BaseModel):
    user_id: str
    role: Literal["editor", "viewer", "client"] = "editor"


class ProjectFileAdd(BaseModel):
    drive_file_id: str
    name: str
    mime_type: str
    size: Optional[int] = None
    web_view_link: Optional[str] = None