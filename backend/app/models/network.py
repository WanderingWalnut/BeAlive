from __future__ import annotations

from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field

from .common import ProfileOut


class ImportContactsRequest(BaseModel):
    emails: List[str] = Field(default_factory=list)
    phones: List[str] = Field(default_factory=list)  # Not yet matched; placeholder for future support


class ContactMatch(BaseModel):
    user_id: UUID
    email: Optional[str] = None
    profile: Optional[ProfileOut] = None


class ImportContactsResponse(BaseModel):
    matches: List[ContactMatch]


class FollowRequest(BaseModel):
    target_user_id: UUID


class NetworkCounts(BaseModel):
    followers: int
    following: int


class NetworkListResponse(BaseModel):
    followers: List[ProfileOut]
    following: List[ProfileOut]
    counts: NetworkCounts

