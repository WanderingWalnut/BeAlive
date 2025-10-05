"""
Network endpoints.

Routes for importing contacts, following/unfollowing users, and listing a user's network.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.models import (
    ImportContactsRequest,
    ImportContactsResponse,
    FollowRequest,
    NetworkListResponse,
)
from app.services.network_service import NetworkService
from app.utils.auth import extract_bearer_token, get_supabase_user_from_token


router = APIRouter()


async def _current_user_id_from_header(authorization: str | None = Header(None)) -> UUID:
    """Derive current user_id from Supabase JWT (Authorization: Bearer <token>)."""
    token = extract_bearer_token(authorization)
    user_payload = get_supabase_user_from_token(token)
    return UUID(user_payload["id"])  # type: ignore[arg-type]


@router.post("/network/import-contacts", response_model=ImportContactsResponse)
async def import_contacts(
    payload: ImportContactsRequest,
    user_id: UUID = Depends(_current_user_id_from_header),
):
    """Upload a set of emails/phones and return matches (phones matched via profiles_with_auth view)."""
    service = NetworkService()
    # Service returns a dict that conforms to ImportContactsResponse
    return service.import_contacts(emails=payload.emails, phones=payload.phones)


@router.post("/network/follow", status_code=status.HTTP_201_CREATED)
async def follow(
    request: FollowRequest,
    user_id: UUID = Depends(_current_user_id_from_header),
):
    """Follow/add a user to the network (creates/upsers an accepted connection)."""
    if request.target_user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    service = NetworkService()
    conn = service.follow(requester_id=user_id, target_user_id=request.target_user_id)
    return {"connection": conn}


@router.delete("/network/follow/{target_user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unfollow(
    target_user_id: UUID,
    user_id: UUID = Depends(_current_user_id_from_header),
):
    """Unfollow/remove a user from the network (deletes directed connection)."""
    if target_user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot unfollow yourself")
    service = NetworkService()
    service.unfollow(requester_id=user_id, target_user_id=target_user_id)
    return None


@router.get("/network", response_model=NetworkListResponse)
async def list_network(user_id: UUID = Depends(_current_user_id_from_header)):
    """List my network with followers, following, and counts."""
    service = NetworkService()
    return service.list_network(user_id=user_id)


@router.post("/network/import-and-follow", response_model=ImportContactsResponse)
async def import_and_follow(
    payload: ImportContactsRequest,
    user_id: UUID = Depends(_current_user_id_from_header),
):
    """
    Import contacts and auto-follow any matched users.
    Returns the same ImportContactsResponse shape as /network/import-contacts.
    """
    service = NetworkService()

    # EITHER: call a helper that does both
    # return service.import_and_follow(requester_id=user_id, emails=payload.emails, phones=payload.phones)

    # OR: do it inline (works with dict result)
    result = service.import_contacts(emails=payload.emails, phones=payload.phones)

    for m in result.get("matches", []):
        try:
            service.follow(requester_id=user_id, target_user_id=UUID(m["user_id"]))
        except Exception:
            # ignore duplicates or races
            pass

    return result
