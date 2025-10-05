from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict
from .challenge import ChallengeCreate
from .common import ProfileOut


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


class CreatePostRequest(BaseModel):
    """Create a post, optionally creating a new challenge atomically.

    Provide either `challenge_id` OR `new_challenge`. If both are provided, `challenge_id` is used.
    """
    challenge_id: Optional[int] = None
    new_challenge: Optional[ChallengeCreate] = None
    caption: Optional[str] = None
    media_url: Optional[str] = None


class PostFull(PostWithCounts):
    """Post + aggregates + author profile."""
    author_profile: Optional[ProfileOut] = None


# Ensure forward refs are resolved (pydantic v2)
PostWithCounts.model_rebuild()
PostFull.model_rebuild()


class PostMediaUpdate(BaseModel):
    media_url: str
