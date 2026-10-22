from typing import Literal, Optional
from pydantic import BaseModel, Field


class ConversationCreate(BaseModel):
    type: Literal["dm", "project"]
    participant_id: Optional[str] = None
    project_id: Optional[str] = None
    name: Optional[str] = None


class AttachmentIn(BaseModel):
    name: str
    url: str
    type: str
    size: int


class MessageCreate(BaseModel):
    content: str = Field(default="", max_length=4000)
    attachments: list[AttachmentIn] = Field(default_factory=list)