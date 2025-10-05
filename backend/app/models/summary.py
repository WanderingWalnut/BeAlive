from __future__ import annotations

from uuid import UUID
from pydantic import BaseModel


class MeSummary(BaseModel):
    """Aggregated summary for the current user."""

    user_id: UUID
    followers: int
    following: int
    challenges_count: int
    posts_count: int
    commitments_for_count: int
    commitments_against_count: int
    for_amount_cents: int
    against_amount_cents: int

