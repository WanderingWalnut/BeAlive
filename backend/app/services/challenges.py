from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import TypeAdapter

from app.models import (
    ChallengeCreate,
    ChallengeOut,
    ChallengeUpdate,
    ChallengeDetail,
    PostWithCounts,
)
from .supabase import get_supabase_client


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


class ChallengeService:
    """Encapsulates challenge CRUD and queries via Supabase.

    Uses PostgREST endpoints: `public.challenges`, `public.posts_with_counts`,
    and the `public.challenge_stats` view for aggregates.
    """

    def __init__(self) -> None:
        self.client = get_supabase_client()

    # -------- Create --------
    def create(self, owner_id: UUID, payload: ChallengeCreate) -> ChallengeOut:
        """Create a challenge for the given owner."""
        data = {
            "owner_id": str(owner_id),
            "title": payload.title,
            "description": payload.description,
            "amount_cents": payload.amount_cents,
            "starts_at": payload.starts_at.isoformat() if payload.starts_at else None,
            "ends_at": payload.ends_at.isoformat() if payload.ends_at else None,
        }
        resp = self.client.table("challenges").insert(data).select("*").execute()
        row = (resp.data or [])[0]
        return TypeAdapter(ChallengeOut).validate_python(row)

    # -------- Read (detail + stats) --------
    def get_detail(self, challenge_id: int) -> ChallengeDetail:
        """Return challenge row with aggregated stats."""
        ch_resp = (
            self.client.table("challenges").select("*").eq("id", challenge_id).limit(1).execute()
        )
        ch = ((ch_resp.data or []) or [None])[0]
        if not ch:
            raise ValueError("Challenge not found")

        st_resp = (
            self.client.table("challenge_stats").select("*").eq("challenge_id", challenge_id).limit(1).execute()
        )
        st_row = ((st_resp.data or []) or [None])[0]
        # `challenge_stats` should always have a row; fall back to zeros if not.
        if not st_row:
            st_row = {
                "challenge_id": challenge_id,
                "amount_cents": ch.get("amount_cents"),
                "for_count": 0,
                "against_count": 0,
                "for_amount_cents": 0,
                "against_amount_cents": 0,
            }
        detail = {
            **ch,
            "for_count": st_row["for_count"],
            "against_count": st_row["against_count"],
            "for_amount_cents": st_row["for_amount_cents"],
            "against_amount_cents": st_row["against_amount_cents"],
        }
        return TypeAdapter(ChallengeDetail).validate_python(detail)

    # -------- Update (metadata) --------
    def update(self, owner_id: UUID, challenge_id: int, patch: ChallengeUpdate) -> ChallengeOut:
        """Update metadata if no commitments exist and owner matches."""
        # Check ownership
        ch_resp = (
            self.client.table("challenges").select("owner_id").eq("id", challenge_id).limit(1).execute()
        )
        ch = ((ch_resp.data or []) or [None])[0]
        if not ch:
            raise ValueError("Challenge not found")
        if str(owner_id) != ch["owner_id"]:
            raise PermissionError("Not the owner")

        # Locked if any commitments exist
        commit_resp = (
            self.client.table("commitments").select("id", count="exact").eq("challenge_id", challenge_id).execute()
        )
        has_any = False
        cnt = getattr(commit_resp, "count", None)
        if isinstance(cnt, int) and cnt > 0:
            has_any = True
        elif isinstance(commit_resp.data, list) and len(commit_resp.data) > 0:
            has_any = True
        if has_any:
            raise RuntimeError("Challenge is locked after first commitment")

        update_fields: Dict[str, Any] = {}
        if patch.title is not None:
            update_fields["title"] = patch.title
        if patch.description is not None:
            update_fields["description"] = patch.description
        if patch.amount_cents is not None:
            update_fields["amount_cents"] = patch.amount_cents
        if patch.starts_at is not None:
            update_fields["starts_at"] = patch.starts_at.isoformat() if patch.starts_at else None
        if patch.ends_at is not None:
            update_fields["ends_at"] = patch.ends_at.isoformat() if patch.ends_at else None

        if not update_fields:
            existing = self.client.table("challenges").select("*").eq("id", challenge_id).limit(1).execute()
            row = ((existing.data or []) or [None])[0]
            return TypeAdapter(ChallengeOut).validate_python(row)

        resp = (
            self.client.table("challenges").update(update_fields).eq("id", challenge_id).select("*").limit(1).execute()
        )
        row = ((resp.data or []) or [None])[0]
        return TypeAdapter(ChallengeOut).validate_python(row)

    # -------- Posts listing for a challenge --------
    def list_posts(
        self,
        challenge_id: int,
        cursor: Optional[datetime] = None,
        limit: int = 20,
    ) -> List[PostWithCounts]:
        q = (
            self.client.table("posts_with_counts")
            .select("*")
            .eq("challenge_id", challenge_id)
            .order("created_at", desc=True)
        )
        if cursor is not None:
            q = q.lt("created_at", cursor.isoformat())
        q = q.limit(max(1, min(limit, 100)))
        resp = q.execute()
        rows = resp.data or []
        return TypeAdapter(List[PostWithCounts]).validate_python(rows)

    # -------- Challenge listing with filters --------
    def list_challenges(
        self,
        creator_id: Optional[UUID] = None,
        active: Optional[bool] = None,
        cursor: Optional[datetime] = None,
        limit: int = 20,
    ) -> List[ChallengeOut]:
        q = self.client.table("challenges").select("*").order("created_at", desc=True)
        if creator_id is not None:
            q = q.eq("owner_id", str(creator_id))
        if cursor is not None:
            q = q.lt("created_at", cursor.isoformat())
        q = q.limit(max(1, min(limit, 100)))
        resp = q.execute()
        rows: List[Dict[str, Any]] = resp.data or []

        # Apply `active` filter client-side if requested
        if active is not None:
            now = _now_utc()

            def is_active(row: Dict[str, Any]) -> bool:
                starts_at = row.get("starts_at")
                ends_at = row.get("ends_at")

                def parse_dt(x: Any) -> Optional[datetime]:
                    if not x:
                        return None
                    try:
                        return datetime.fromisoformat(x.replace("Z", "+00:00"))
                    except Exception:
                        return None

                s = parse_dt(starts_at)
                e = parse_dt(ends_at)
                ok_s = s is None or s <= now
                ok_e = e is None or e >= now
                return ok_s and ok_e

            rows = [r for r in rows if (is_active(r) if active else not is_active(r))]

        return TypeAdapter(List[ChallengeOut]).validate_python(rows)

