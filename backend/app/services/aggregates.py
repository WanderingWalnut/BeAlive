from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional, Tuple
from uuid import UUID

from pydantic import TypeAdapter

from app.models import ChallengeStats, MeSummary
from .supabase import get_supabase_client


def _get_count(resp: Any) -> int:
    cnt = getattr(resp, "count", None)
    if isinstance(cnt, int):
        return cnt
    data = getattr(resp, "data", None) or []
    return len(data) if isinstance(data, list) else 0


class AggregatesService:
    """Aggregate/stat endpoints backed by Supabase views and simple counts."""

    def __init__(self) -> None:
        self.client = get_supabase_client()

    def challenge_stats(self, challenge_id: int) -> ChallengeStats:
        resp = (
            self.client.table("challenge_stats").select("*").eq("challenge_id", challenge_id).limit(1).execute()
        )
        row = ((resp.data or []) or [None])[0]
        if not row:
            # If no row (no commitments yet), synthesize zeros by fetching amount
            ch = (
                self.client.table("challenges").select("amount_cents").eq("id", challenge_id).limit(1).execute()
            )
            ch_row = ((ch.data or []) or [None])[0]
            if not ch_row:
                raise ValueError("Challenge not found")
            row = {
                "challenge_id": challenge_id,
                "amount_cents": ch_row["amount_cents"],
                "for_count": 0,
                "against_count": 0,
                "for_amount_cents": 0,
                "against_amount_cents": 0,
            }
        return TypeAdapter(ChallengeStats).validate_python(row)

    def me_summary(self, user_id: UUID) -> MeSummary:
        # Followers: others -> me
        followers_resp = (
            self.client.table("connections")
            .select("id", count="exact")
            .eq("addressee_id", str(user_id))
            .eq("status", "accepted")
            .execute()
        )
        followers = _get_count(followers_resp)

        # Following: me -> others
        following_resp = (
            self.client.table("connections")
            .select("id", count="exact")
            .eq("requester_id", str(user_id))
            .eq("status", "accepted")
            .execute()
        )
        following = _get_count(following_resp)

        # My challenges count
        challenges_resp = (
            self.client.table("challenges").select("id", count="exact").eq("owner_id", str(user_id)).execute()
        )
        challenges_count = _get_count(challenges_resp)

        # My posts count
        posts_resp = (
            self.client.table("posts").select("id", count="exact").eq("author_id", str(user_id)).execute()
        )
        posts_count = _get_count(posts_resp)

        # My commitments breakdown
        commits_resp = (
            self.client.table("commitments")
            .select("challenge_id,side")
            .eq("user_id", str(user_id))
            .execute()
        )
        commits = (commits_resp.data or [])
        for_ids = [c["challenge_id"] for c in commits if c.get("side") == "for"]
        against_ids = [c["challenge_id"] for c in commits if c.get("side") == "against"]
        commitments_for_count = len(for_ids)
        commitments_against_count = len(against_ids)

        # Sum amounts per side by joining to challenges
        def sum_amounts(ids: List[int]) -> int:
            if not ids:
                return 0
            ch_resp = (
                self.client.table("challenges").select("id,amount_cents").in_("id", ids).execute()
            )
            rows = ch_resp.data or []
            return sum(int(r.get("amount_cents") or 0) for r in rows)

        for_amount = sum_amounts(for_ids)
        against_amount = sum_amounts(against_ids)

        return MeSummary(
            user_id=user_id,
            followers=followers,
            following=following,
            challenges_count=challenges_count,
            posts_count=posts_count,
            commitments_for_count=commitments_for_count,
            commitments_against_count=commitments_against_count,
            for_amount_cents=for_amount,
            against_amount_cents=against_amount,
        )

