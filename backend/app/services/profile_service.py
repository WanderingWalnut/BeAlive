from __future__ import annotations

from typing import Dict, Iterable, List, Optional
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

    def upsert_profile(
        self,
        *,
        user_id: UUID,
        username: Optional[str] = None,
        full_name: Optional[str] = None,
        avatar_url: Optional[str] = None,
    ) -> ProfileOut:
        """Create or update a profile row for the given user.

        This writes directly to public.profiles. It stores the avatar as a storage key/path
        (not a signed URL). The caller is responsible for validating user permissions.
        """
        upsert_data: Dict[str, Optional[str]] = {
            "user_id": str(user_id),
        }
        if username is not None:
            upsert_data["username"] = username
        if full_name is not None:
            upsert_data["full_name"] = full_name
        if avatar_url is not None:
            upsert_data["avatar_url"] = avatar_url

        # Upsert returns a sync builder; execute it first
        upsert_resp = (
            self.client
            .table("profiles")
            .upsert(upsert_data, on_conflict="user_id")
            .execute()
        )
        
        # Then fetch the row back
        fetch = (
            self.client.table("profiles")
            .select("*")
            .eq("user_id", str(user_id))
            .limit(1)
            .execute()
        )
        rows = getattr(fetch, "data", None) or []
        row = rows[0] if isinstance(rows, list) and rows else None
        adapter = TypeAdapter(ProfileOut)
        return adapter.validate_python(row)

