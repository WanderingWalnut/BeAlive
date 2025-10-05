from __future__ import annotations

from datetime import datetime
from typing import Dict, Optional
from pydantic import BaseModel, Field


class PresignRequest(BaseModel):
    post_id: int = Field(..., ge=1, description="ID of the post this upload belongs to")
    file_ext: str = Field(..., description="File extension like jpg, png, mp4")
    content_type: Optional[str] = Field(None, description="MIME type, e.g. image/jpeg")
    upsert: bool = Field(default=True)


class PresignResponse(BaseModel):
    upload_url: str
    method: str = "POST"
    headers: Dict[str, str] = Field(default_factory=dict)
    path: str = Field(..., description="Storage path to save on the post as media_url")
    expires_at: Optional[datetime] = None
