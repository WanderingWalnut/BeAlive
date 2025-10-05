from __future__ import annotations

from typing import Dict, Iterable, List
from uuid import UUID

from pydantic import TypeAdapter

from app.models import ProfileOut
from .supabase import get_supabase_client


class ProfileService:
    """Profile-related helpers using Supabase.

    This service reads from public.profiles and parses into Pydantic models.
    """

    def __init__(self) -> None:
        self.client = get_supabase_client()

    def get_profiles_by_ids(self, user_ids: Iterable[UUID]) -> Dict[UUID, ProfileOut]:
        """Fetch profiles for a set of user IDs and return a dict keyed by user_id."""
        ids: List[str] = [str(uid) for uid in user_ids]
        if not ids:
            return {}
        resp = (
            self.client.table("profiles")
            .select("*")
            .in_("user_id", ids)
            .execute()
        )
        rows = resp.data or []
        adapter = TypeAdapter(list[ProfileOut])
        profiles = adapter.validate_python(rows)
        return {p.user_id: p for p in profiles}

