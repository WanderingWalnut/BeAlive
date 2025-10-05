"""
Uploads endpoints.

Provides a presigned upload URL for Supabase Storage 'posts' bucket. Clients then upload
directly to Storage using the returned URL, and include the returned 'path' as the media_url
when creating or updating a post.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Header

from app.models import PresignRequest, PresignResponse
from app.services.uploads import UploadService
from app.utils.auth import extract_bearer_token, get_supabase_user_from_token


router = APIRouter()


def _current_user_id(authorization: str | None = Header(None)) -> UUID:
    token = extract_bearer_token(authorization)
    user_payload = get_supabase_user_from_token(token)
    return UUID(user_payload["id"])  # type: ignore[arg-type]


@router.post("/uploads/presign", response_model=PresignResponse)
async def presign_upload(body: PresignRequest, user_id: UUID = Depends(_current_user_id)):
    """Return a signed upload URL for the authenticated user and a specific post.

    The response includes:
    - upload_url: where to POST the file
    - method + headers: how to call it (include Content-Type and x-upsert)
    - path: the storage key to persist as media_url on the given post
    """
    svc = UploadService()
    return svc.presign(user_id=user_id, req=body)
