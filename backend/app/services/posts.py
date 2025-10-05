from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from pydantic import TypeAdapter

from app.models import (
    CreatePostRequest,
    PostOut,
    PostWithCounts,
    PostFull,
    ProfileOut,
    PostMediaUpdate,
)
from .supabase import get_supabase_client
from .profile_service import ProfileService


class PostService:
    """Post-related operations with optional atomic challenge creation via RPC."""

    def __init__(self) -> None:
        self.client = get_supabase_client()
        self.profiles = ProfileService()

    def create(self, author_id: UUID, body: CreatePostRequest) -> PostWithCounts:
        """Create a post; optionally create a new challenge atomically using RPC."""
        # Intentionally ignore body.media_url on create to prevent uploads without a challenge/post linkage.
        params = {
            # Explicitly pass the actor id so the DB function doesn't depend on auth.uid()
            "p_actor_id": str(author_id),
            "p_challenge_id": body.challenge_id,
            "p_title": body.new_challenge.title if body.new_challenge else None,
            "p_description": body.new_challenge.description if body.new_challenge else None,
            "p_amount_cents": body.new_challenge.amount_cents if body.new_challenge else None,
            "p_starts_at": body.new_challenge.starts_at.isoformat() if body.new_challenge and body.new_challenge.starts_at else None,
            "p_ends_at": body.new_challenge.ends_at.isoformat() if body.new_challenge and body.new_challenge.ends_at else None,
            "p_caption": body.caption,
            # Do not allow setting media on initial create; require presign + upload + PATCH
            "p_media_url": None,
        }
        resp = self.client.rpc("create_post_with_optional_challenge", params).execute()
        row = (resp.data or [])[0] if isinstance(resp.data, list) else resp.data
        return TypeAdapter(PostWithCounts).validate_python(row)

    def get(self, post_id: int) -> PostFull:
        """Get a single post with aggregates and author profile."""
        resp = (
            self.client.table("posts_with_counts").select("*").eq("id", post_id).limit(1).execute()
        )
        row = ((resp.data or []) or [None])[0]
        if not row:
            raise ValueError("Post not found")
        post = TypeAdapter(PostWithCounts).validate_python(row)
        # Hydrate author profile
        profiles = self.profiles.get_profiles_by_ids([post.author_id])
        return PostFull(**post.model_dump(), author_profile=profiles.get(post.author_id))

    def delete(self, author_id: UUID, post_id: int) -> None:
        """Author-only delete (RLS enforces)."""
        # RLS policy posts_author_delete ensures only author can delete.
        self.client.table("posts").delete().eq("id", post_id).execute()

    def update_media(self, author_id: UUID, post_id: int, body: PostMediaUpdate) -> PostWithCounts:
        """Update media_url for a post (author-only; RLS enforces)."""
        # Perform the update; supabase-py may not support chaining select() after update in this version
        self.client.table("posts").update({"media_url": body.media_url}).eq("id", post_id).execute()
        # Verify the post exists by reading back
        check = self.client.table("posts").select("id").eq("id", post_id).limit(1).execute()
        if not (check.data or []):
            raise ValueError("Post not found")
        # Recompute aggregates by reading from posts_with_counts
        pwc = (
            self.client.table("posts_with_counts").select("*").eq("id", post_id).limit(1).execute()
        )
        prow = ((pwc.data or []) or [None])[0]
        return TypeAdapter(PostWithCounts).validate_python(prow)
