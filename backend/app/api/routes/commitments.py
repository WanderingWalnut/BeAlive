"""
Commitments endpoints.

Includes:
- POST /challenges/{challenge_id}/commitments → create (idempotent)
- GET  /challenges/{challenge_id}/commitments/me → my commitment
- GET  /challenges/{challenge_id}/commitments → list
"""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Path, Query, status

from app.models import CommitmentOut, CommitmentRequest, CommitmentSide
from app.services.commitments import CommitmentService
from app.utils.auth import extract_bearer_token, get_supabase_user_from_token


router = APIRouter()


def _token(authorization: str | None = Header(None)) -> str:
    return extract_bearer_token(authorization)


def _current_user_id(authorization: str | None = Header(None)) -> UUID:
    token = extract_bearer_token(authorization)
    user_payload = get_supabase_user_from_token(token)
    return UUID(user_payload["id"])  # type: ignore[arg-type]


@router.post("/challenges/{challenge_id}/commitments", response_model=CommitmentOut, status_code=status.HTTP_201_CREATED)
async def create_commitment(
    challenge_id: int = Path(..., ge=1),
    body: CommitmentRequest | None = None,
    user_id: UUID = Depends(_current_user_id),
    token: str = Depends(_token),
):
    """Create a commitment for the current user.

    Idempotent: if a commitment already exists, returns the existing row.
    """
    if not body or not body.direction:
        raise HTTPException(status_code=400, detail="direction is required")
    svc = CommitmentService(token)
    try:
        return svc.create(user_id=user_id, challenge_id=challenge_id, side=body.direction, idempotency_key=body.idempotency_key)
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not allowed")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/challenges/{challenge_id}/commitments/me", response_model=CommitmentOut)
async def get_my_commitment(
    challenge_id: int = Path(..., ge=1),
    user_id: UUID = Depends(_current_user_id),
    token: str = Depends(_token),
):
    svc = CommitmentService(token)
    c = svc.get_my(user_id=user_id, challenge_id=challenge_id)
    if not c:
        raise HTTPException(status_code=404, detail="Not found")
    return c


@router.get("/challenges/{challenge_id}/commitments", response_model=List[CommitmentOut])
async def list_commitments(
    challenge_id: int = Path(..., ge=1),
    limit: int = Query(default=50, ge=1, le=100),
    token: str = Depends(_token),
):
    svc = CommitmentService(token)
    return svc.list_for_challenge(challenge_id=challenge_id, limit=limit)

