from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


Platform = Literal["IG", "TT", "YT", "X", "FB"]


class ScheduledMedia(BaseModel):
    drive_file_id: str
    name: str
    mime_type: str
    web_view_link: Optional[str] = None


class ScheduledPostCreate(BaseModel):
    caption: str = Field(default="", max_length=2200)
    platforms: list[Platform] = Field(min_length=1)
    scheduled_for: datetime
    project_id: Optional[str] = None
    media: list[ScheduledMedia] = Field(default_factory=list)


class ScheduledPostUpdate(BaseModel):
    caption: Optional[str] = None
    platforms: Optional[list[Platform]] = None
    scheduled_for: Optional[datetime] = None
    status: Optional[Literal["draft", "queued"]] = None
    media: Optional[list[ScheduledMedia]] = None