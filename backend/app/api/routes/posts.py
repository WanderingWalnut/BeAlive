"""
Post endpoints.

Phase 4: create (optionally create challenge atomically), get with aggregates + author, author-only delete.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Path, status

from app.models import CreatePostRequest, PostFull, PostWithCounts, PostMediaUpdate
from app.services.posts import PostService
from app.utils.auth import extract_bearer_token, get_supabase_user_from_token


router = APIRouter()


def _current_user_id(authorization: str | None = Header(None)) -> UUID:
    token = extract_bearer_token(authorization)
    user_payload = get_supabase_user_from_token(token)
    return UUID(user_payload["id"])  # type: ignore[arg-type]


@router.post("/posts", response_model=PostWithCounts, status_code=status.HTTP_201_CREATED)
async def create_post(body: CreatePostRequest, user_id: UUID = Depends(_current_user_id)):
    """Create a post.

    - Provide `challenge_id` to post under an existing challenge (must be owner).
    - Or provide `new_challenge` to create a challenge + post atomically (owner=caller).
    Note: Media uploads are not part of the DB transaction. Ensure you upload after receiving
    the created post, or pre-generate a key and pass it as `media_url`.
    """
    try:
        service = PostService()
        return service.create(author_id=user_id, body=body)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/posts/{post_id}", response_model=PostFull)
async def get_post(post_id: int = Path(..., ge=1)):
    """Get post + aggregates + author profile."""
    try:
        service = PostService()
        return service.get(post_id=post_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Post not found")


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: int = Path(..., ge=1), user_id: UUID = Depends(_current_user_id)):
    """Delete a post (author-only; enforced by RLS)."""
    service = PostService()
    service.delete(author_id=user_id, post_id=post_id)
    return None


@router.patch("/posts/{post_id}/media", response_model=PostWithCounts)
async def update_post_media(
    post_id: int = Path(..., ge=1),
    body: PostMediaUpdate | None = None,
    user_id: UUID = Depends(_current_user_id),
):
    """Update only the media_url for a post after a successful upload.

    Use with the storage presign flow: first POST /uploads/presign, upload the file,
    then call this endpoint with the returned `path`.
    """
    if not body or not body.media_url:
        raise HTTPException(status_code=400, detail="media_url is required")
    service = PostService()
    try:
        return service.update_media(author_id=user_id, post_id=post_id, body=body)
    except ValueError:
        raise HTTPException(status_code=404, detail="Post not found")
