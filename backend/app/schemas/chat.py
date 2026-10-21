from pydantic import BaseModel, Field
from typing import Optional, Literal


class ConversationCreate(BaseModel):
    type: Literal["dm", "project"]
    participant_id: Optional[str] = None   # for DMs
    project_id: Optional[str] = None        # for project rooms
    name: Optional[str] = None              # optional override for project room


class AttachmentIn(BaseModel):
    name: str
    url: str
    type: str
    size: int


class MessageCreate(BaseModel):
    content: str = Field(default="", max_length=4000)
    attachments: list[AttachmentIn] = Field(default_factory=list)