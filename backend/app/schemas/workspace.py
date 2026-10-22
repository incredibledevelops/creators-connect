from typing import Literal
from pydantic import BaseModel, Field, EmailStr

class WorkspaceMemberAdd(BaseModel):
    user_id: str
    role: Literal["editor", "viewer", "client"] = "editor"

class WorkspaceInvite(BaseModel):
    email: EmailStr
    role: Literal["editor", "viewer", "client"] = "editor"

class WorkspaceRename(BaseModel):
    name: str = Field(min_length=1, max_length=80)