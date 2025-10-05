from __future__ import annotations

from typing import Iterable, List, Tuple
from uuid import UUID

from pydantic import TypeAdapter

from app.models import (
    ChallengeStats,
    CommitmentOut,
    ConnectionOut,
    ContactMatch,
    ImportContactsResponse,
    NetworkListResponse,
    NetworkCounts,
    ProfileOut,
)
from .supabase import get_supabase_client
from .profile_service import ProfileService


class NetworkService:
    """Encapsulates network-related operations (contacts import, follow/unfollow, listing).

    Notes:
    - Follows are represented via the `connections` table with status='accepted'.
    - Unfollow removes the directed connection row (requester -> addressee).
    - Listing uses directed semantics for followers/following counts.
    - Contact import currently matches by email via Supabase Auth Admin (naive scan),
      then hydrates profiles from public.profiles.
    """

    def __init__(self) -> None:
        self.client = get_supabase_client()
        self.profiles = ProfileService()

    # -------- Contacts Import --------
    def import_contacts(self, emails: List[str], phones: List[str]) -> ImportContactsResponse:
        """Match provided emails/phones to existing users.

        Email matching uses the Auth admin list (requires service role credentials). For now,
        we perform a simple scan over pages and filter locally by provided emails.
        Phone matching is not implemented due to absence of phone field in profiles.
        """
        emails_set = {e.lower() for e in emails if e}
        matches: List[ContactMatch] = []

        if emails_set:
            # Naive admin scan (replace with better query or RPC when available)
            admin = self.client.auth.admin
            page = 1
            page_size = 100
            found: List[Tuple[UUID, str]] = []
            while True:
                users_page = admin.list_users(page=page, per_page=page_size)
                data = getattr(users_page, "data", None) or getattr(users_page, "users", None) or []
                if not data:
                    break
                for u in data:
                    email = (u.get("email") or "").lower()
                    if email in emails_set:
                        uid = UUID(u["id"])  # Supabase returns string UUID
                        found.append((uid, email))
                if len(data) < page_size:
                    break
                page += 1

            # Hydrate profile info
            ids = [uid for uid, _ in found]
            profile_map = self.profiles.get_profiles_by_ids(ids)
            for uid, email in found:
                matches.append(
                    ContactMatch(user_id=uid, email=email, profile=profile_map.get(uid))
                )

        # Phones: not implemented (no phone in schema); keep placeholder for future.

        return ImportContactsResponse(matches=matches)

    # -------- Follow / Unfollow --------
    def follow(self, requester_id: UUID, target_user_id: UUID) -> ConnectionOut:
        """Create an accepted connection requester -> target. Idempotent upsert behavior."""
        payload = {
            "requester_id": str(requester_id),
            "addressee_id": str(target_user_id),
            "status": "accepted",
        }
        # Upsert-like behavior: try insert; if conflict, update status to accepted
        resp = (
            self.client.table("connections")
            .upsert(payload, on_conflict="requester_id,addressee_id")
            .select("*")
            .execute()
        )
        row = (resp.data or [])[0]
        return TypeAdapter(ConnectionOut).validate_python(row)

    def unfollow(self, requester_id: UUID, target_user_id: UUID) -> None:
        """Remove directed connection requester -> target if it exists."""
        (
            self.client.table("connections")
            .delete()
            .eq("requester_id", str(requester_id))
            .eq("addressee_id", str(target_user_id))
            .execute()
        )

    # -------- List Network --------
    def list_network(self, user_id: UUID) -> NetworkListResponse:
        """Return followers and following lists with counts (profiles hydrated)."""
        # Following: I -> others
        following_rows = (
            self.client.table("connections")
            .select("addressee_id")
            .eq("requester_id", str(user_id))
            .eq("status", "accepted")
            .execute()
        ).data or []
        following_ids = [UUID(r["addressee_id"]) for r in following_rows]

        # Followers: others -> me
        followers_rows = (
            self.client.table("connections")
            .select("requester_id")
            .eq("addressee_id", str(user_id))
            .eq("status", "accepted")
            .execute()
        ).data or []
        followers_ids = [UUID(r["requester_id"]) for r in followers_rows]

        # Hydrate profiles
        profile_map = self.profiles.get_profiles_by_ids(set(following_ids + followers_ids))
        following_profiles = [p for uid in following_ids if (p := profile_map.get(uid))]
        followers_profiles = [p for uid in followers_ids if (p := profile_map.get(uid))]

        counts = NetworkCounts(followers=len(followers_profiles), following=len(following_profiles))
        return NetworkListResponse(
            followers=followers_profiles,
            following=following_profiles,
            counts=counts,
        )

