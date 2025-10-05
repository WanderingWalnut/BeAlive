from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import TypeAdapter

from app.models import (
    FeedResponse,
    PostWithCounts,
    ChallengeDetail,
    ChallengeOut,
)
from .supabase import get_supabase_client


class FeedService:
    """Feed and discovery operations using Supabase, with per-request user token for RLS."""

    def __init__(self, access_token: str) -> None:
        self.client = get_supabase_client()
        # Ensure RLS/auth.uid() context is set for this request
        try:
            self.client.postgrest.auth(access_token)
        except Exception:
            # Older supabase-py versions may differ; if auth() is unavailable, requests will run without RLS context.
            pass

    # ---- /feed ----
    def get_feed(self, after: Optional[datetime], limit: int) -> FeedResponse:
        params = {"p_after": after.isoformat() if after else None, "p_limit": limit}
        resp = self.client.rpc("get_feed", params).execute()
        rows = resp.data or []
        items = TypeAdapter(List[PostWithCounts]).validate_python(rows)
        next_cursor = items[-1].created_at if items else None
        return FeedResponse(items=items, next_cursor=next_cursor)

    # ---- /feed/challenges/trending ---- #Not in use/need atm
    def trending_challenges(self, limit: int = 20) -> List[ChallengeDetail]:
        # Get top challenge ids by total commitments count
        stats = (
            self.client.table("challenge_stats")
            .select("challenge_id,for_count,against_count,for_amount_cents,against_amount_cents,amount_cents")
            .order("for_count", desc=True)
            .order("against_count", desc=True)
            .limit(limit)
            .execute()
        )
        rows = stats.data or []
        ids = [r["challenge_id"] for r in rows]
        if not ids:
            return []
        # Fetch challenge rows (RLS applies)
        chs = self.client.table("challenges").select("*").in_("id", ids).execute().data or []
        ch_map = {c["id"]: c for c in chs}
        out: List[ChallengeDetail] = []
        for r in rows:
            ch = ch_map.get(r["challenge_id"]) or None
            if not ch:
                continue
            merged = {
                **ch,
                "for_count": r.get("for_count", 0),
                "against_count": r.get("against_count", 0),
                "for_amount_cents": r.get("for_amount_cents", 0),
                "against_amount_cents": r.get("against_amount_cents", 0),
            }
            out.append(TypeAdapter(ChallengeDetail).validate_python(merged))
        return out

    # ---- /users/{user_id}/posts ----
    def user_posts(self, user_id: UUID, cursor: Optional[datetime], limit: int) -> List[PostWithCounts]:
        q = (
            self.client.table("posts_with_counts")
            .select("*")
            .eq("author_id", str(user_id))
            .order("created_at", desc=True)
        )
        if cursor is not None:
            q = q.lt("created_at", cursor.isoformat())
        q = q.limit(max(1, min(limit, 100)))
        resp = q.execute()
        rows = resp.data or []
        return TypeAdapter(List[PostWithCounts]).validate_python(rows)

    # ---- /challenges/search ----
    def search_challenges(self, query: str, limit: int = 20) -> List[ChallengeOut]:
        # Simple ILIKE on title + description, ordered by recency
        # PostgREST supports `or` filter with `ilike` expressions
        ilike = f"%{query}%"
        resp = (
            self.client.table("challenges")
            .select("*")
            .or_(f"title.ilike.{ilike},description.ilike.{ilike}")
            .order("created_at", desc=True)
            .limit(max(1, min(limit, 100)))
            .execute()
        )
        rows = resp.data or []
        return TypeAdapter(List[ChallengeOut]).validate_python(rows)

