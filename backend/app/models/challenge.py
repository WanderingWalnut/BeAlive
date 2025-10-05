from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID


class ChallengeBase(BaseModel):
    title: str
    description: Optional[str] = None
    amount_cents: int = Field(..., gt=0)
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class ChallengeCreate(ChallengeBase):
    pass


class ChallengeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    amount_cents: Optional[int] = Field(None, gt=0)
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class ChallengeOut(ChallengeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    owner_id: UUID
    created_at: datetime


class ChallengeStats(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    challenge_id: int
    amount_cents: int
    for_count: int
    against_count: int
    for_amount_cents: int
    against_amount_cents: int
