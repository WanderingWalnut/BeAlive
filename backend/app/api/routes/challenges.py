"""
Challenge endpoints.

Phase 3: create, details, update, posts listing, and challenge listing with filters.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status

from app.models import (
    ChallengeCreate,
    ChallengeUpdate,
    ChallengeOut,
    ChallengeDetail,
    ChallengeStats,
    PostWithCounts,
)
from app.utils.auth import extract_bearer_token, get_supabase_user_from_token
from app.services.challenges import ChallengeService
from app.services.aggregates import AggregatesService


router = APIRouter()


def _current_user_id(authorization: str | None = Header(None)) -> UUID:
    token = extract_bearer_token(authorization)
    user_payload = get_supabase_user_from_token(token)
    return UUID(user_payload["id"])  # type: ignore[arg-type]


@router.post("/challenges", response_model=ChallengeOut, status_code=status.HTTP_201_CREATED)
async def create_challenge(body: ChallengeCreate, user_id: UUID = Depends(_current_user_id)):
    """Create a challenge owned by the authenticated user."""
    try:
        service = ChallengeService()
        return service.create(owner_id=user_id, payload=body)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/challenges/{challenge_id}", response_model=ChallengeDetail)
async def get_challenge(challenge_id: int):
    """Get challenge details with aggregate stats."""
    try:
        service = ChallengeService()
        return service.get_detail(challenge_id=challenge_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Challenge not found")


@router.patch("/challenges/{challenge_id}", response_model=ChallengeOut)
async def update_challenge(challenge_id: int, body: ChallengeUpdate, user_id: UUID = Depends(_current_user_id)):
    """Update challenge metadata if not locked (no commitments) and owned by user."""
    service = ChallengeService()
    try:
        return service.update(owner_id=user_id, challenge_id=challenge_id, patch=body)
    except ValueError:
        raise HTTPException(status_code=404, detail="Challenge not found")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not the owner")
    except RuntimeError as e:
        # Locked after first commitment
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/challenges/{challenge_id}/posts", response_model=List[PostWithCounts])
async def list_challenge_posts(
    challenge_id: int,
    cursor: Optional[datetime] = Query(default=None, description="Return items created before this timestamp"),
    limit: int = Query(default=20, ge=1, le=100),
):
    """Paginated posts for a challenge, newest first."""
    service = ChallengeService()
    return service.list_posts(challenge_id=challenge_id, cursor=cursor, limit=limit)


@router.get("/challenges", response_model=List[ChallengeOut])
async def list_challenges(
    creator_id: Optional[UUID] = Query(default=None, description="Filter by owner_id"),
    active: Optional[bool] = Query(default=None, description="Only active/inactive challenges"),
    cursor: Optional[datetime] = Query(default=None, description="Return items created before this timestamp"),
    limit: int = Query(default=20, ge=1, le=100),
):
    """List challenges with optional filters and cursor-based pagination by created_at."""
    service = ChallengeService()
    return service.list_challenges(creator_id=creator_id, active=active, cursor=cursor, limit=limit)


@router.get("/challenges/{challenge_id}/stats", response_model=ChallengeStats)
async def get_challenge_stats(challenge_id: int):
    """Return aggregate stats for a single challenge."""
    svc = AggregatesService()
    try:
        return svc.challenge_stats(challenge_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Challenge not found")
