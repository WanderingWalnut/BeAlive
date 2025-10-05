from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from pydantic import TypeAdapter

from app.models import CommitmentOut, CommitmentSide
from .supabase import get_supabase_client


class CommitmentService:
    """Commitment operations using the caller's token for RLS enforcement."""

    def __init__(self, access_token: str) -> None:
        self.client = get_supabase_client()
        try:
            self.client.postgrest.auth(access_token)
        except Exception:
            pass

    def get_my(self, user_id: UUID, challenge_id: int) -> Optional[CommitmentOut]:
        resp = (
            self.client.table("commitments")
            .select("*")
            .eq("user_id", str(user_id))
            .eq("challenge_id", challenge_id)
            .limit(1)
            .execute()
        )
        row = ((resp.data or []) or [None])[0]
        return TypeAdapter(CommitmentOut).validate_python(row) if row else None

    def create(self, user_id: UUID, challenge_id: int, side: CommitmentSide, idempotency_key: str | None = None) -> CommitmentOut:
        # Idempotency is best-effort: if existing, return it.
        existing = self.get_my(user_id, challenge_id)
        if existing:
            return existing
        payload = {
            "user_id": str(user_id),
            "challenge_id": challenge_id,
            "side": side.value,
        }
        try:
            # Insert and then fetch - some supabase-py versions don't support chaining select after insert
            resp = self.client.table("commitments").insert(payload).execute()
            
            # Fetch the newly created commitment
            created = self.get_my(user_id, challenge_id)
            if not created:
                raise RuntimeError("Failed to create commitment")
            return created
        except Exception as e:
            # Handle unique violation race: return existing
            again = self.get_my(user_id, challenge_id)
            if again:
                return again
            raise

    def list_for_challenge(self, challenge_id: int, limit: int = 100, cursor: int | None = None) -> List[CommitmentOut]:
        # Simple listing; ordered by created_at desc. Cursor is not implemented (not requested).
        resp = (
            self.client.table("commitments")
            .select("*")
            .eq("challenge_id", challenge_id)
            .order("created_at", desc=True)
            .limit(max(1, min(limit, 100)))
            .execute()
        )
        rows = resp.data or []
        return TypeAdapter(List[CommitmentOut]).validate_python(rows)
    
    def list_my_commitments(self, user_id: UUID, limit: int = 100) -> List[CommitmentOut]:
        """List all commitments for a specific user."""
        resp = (
            self.client.table("commitments")
            .select("*")
            .eq("user_id", str(user_id))
            .order("created_at", desc=True)
            .limit(max(1, min(limit, 100)))
            .execute()
        )
        rows = resp.data or []
        return TypeAdapter(List[CommitmentOut]).validate_python(rows)

