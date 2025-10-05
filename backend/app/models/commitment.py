from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from .common import CommitmentSide


class CommitmentCreate(BaseModel):
    challenge_id: int
    side: CommitmentSide
    # user_id is set server-side from auth


class CommitmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: UUID
    challenge_id: int
    side: CommitmentSide
    created_at: datetime


class CommitmentRequest(BaseModel):
    """Request to create a commitment for a challenge."""
    direction: CommitmentSide
    idempotency_key: str | None = None
