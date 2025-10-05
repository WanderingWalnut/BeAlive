"""
Feed & Discovery endpoints.

Includes:
- GET /feed → { items, next_cursor }
- GET /feed/challenges/trending
- GET /users/{user_id}/posts
- GET /challenges/search
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query

from app.models import FeedResponse, PostWithCounts, ChallengeDetail, ChallengeOut
from app.services.feed import FeedService
from app.utils.auth import extract_bearer_token


router = APIRouter()


def _access_token(authorization: str | None = Header(None)) -> str:
    return extract_bearer_token(authorization)


@router.get("/feed", response_model=FeedResponse)
async def get_feed(
    cursor: Optional[datetime] = Query(default=None, description="Return items created before this timestamp"),
    limit: int = Query(default=20, ge=1, le=100),
    token: str = Depends(_access_token),
):
    svc = FeedService(token)
    return svc.get_feed(after=cursor, limit=limit)


@router.get("/feed/challenges/trending", response_model=List[ChallengeDetail])
async def trending_challenges(
    limit: int = Query(default=10, ge=1, le=50),
    token: str = Depends(_access_token),
):
    svc = FeedService(token)
    return svc.trending_challenges(limit=limit)


@router.get("/users/{user_id}/posts", response_model=List[PostWithCounts])
async def user_posts(
    user_id: UUID,
    cursor: Optional[datetime] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    token: str = Depends(_access_token),
):
    svc = FeedService(token)
    return svc.user_posts(user_id=user_id, cursor=cursor, limit=limit)


@router.get("/challenges/search", response_model=List[ChallengeOut])
async def search_challenges(
    q: str = Query(..., min_length=1),
    limit: int = Query(default=20, ge=1, le=100),
    token: str = Depends(_access_token),
):
    svc = FeedService(token)
    return svc.search_challenges(query=q, limit=limit)

