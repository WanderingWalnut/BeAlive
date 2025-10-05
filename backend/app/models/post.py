from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class PostCreate(BaseModel):
    challenge_id: int
    caption: Optional[str] = None
    media_url: Optional[str] = None
    # author_id is set server-side from auth


class PostUpdate(BaseModel):
    caption: Optional[str] = None
    media_url: Optional[str] = None


class PostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    challenge_id: int
    author_id: UUID
    caption: Optional[str] = None
    media_url: Optional[str] = None
    created_at: datetime


class PostWithCounts(PostOut):
    for_count: int
    against_count: int
    for_amount_cents: int
    against_amount_cents: int


class FeedParams(BaseModel):
    p_after: Optional[datetime] = None
    p_limit: int = Field(default=50, ge=1, le=100)


FeedItem = PostWithCounts

