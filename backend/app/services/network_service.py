# app/services/network_service.py
from __future__ import annotations
from typing import List, Dict, Any
from uuid import UUID
import re
from .supabase import get_supabase_client

class NetworkService:
    def __init__(self) -> None:
        self.client = get_supabase_client()

    def _normalize_phones(self, phones: List[str]) -> List[str]:
        """
        Normalize to a US-like E.164 form:
        - strip non-digits except '+'
        - if 10 digits -> prefix '1'
        - if 11 digits starting with '1' -> keep
        - if starts with '+' -> keep as-is
        """
        norm: List[str] = []
        for raw in phones or []:
            if not raw:
                continue
            s = re.sub(r"[^0-9+]", "", raw)
            if s.startswith("+"):
                norm.append(s[1:])  # store without '+', because your DB has no '+'
            else:
                digits = re.sub(r"[^0-9]", "", s)
                if len(digits) == 10:          # e.g. 8257359842
                    norm.append("1" + digits)  # -> 18257359842
                elif len(digits) == 11 and digits.startswith("1"):
                    norm.append(digits)        # already 1XXXXXXXXXX
                else:
                    # keep as-is just in case
                    norm.append(digits)
        # de-dupe and drop empties
        return [x for x in sorted(set(norm)) if x]

    def import_contacts(self, emails: List[str], phones: List[str]) -> Dict[str, Any]:
        """
        Match by phone using the profiles_with_auth view.
        Tries exact E.164-like match AND a 'last 10 digits' fallback.
        """
        norm = self._normalize_phones(phones)

        # last-10 digits variants for fuzzy OR matching
        last10 = sorted({p[-10:] for p in norm if len(p) >= 10})

        print("[network] incoming phones:", phones)
        print("[network] normalized phones:", norm, "last10:", last10)

        matches: List[Dict[str, Any]] = []
        if not norm and not last10:
            return {"matches": matches}

        q = (
            self.client
            .table("profiles_with_auth")
            .select("user_id,username,full_name,avatar_url,phone_e164")
        )

        # Prefer exact first
        if norm:
            q = q.in_("phone_e164", norm)

        # If you want to ALWAYS include the last10 fallback, use an OR:
        # (PostgREST OR filter must be a single string)
        if last10:
            or_clause = ",".join([f"phone_e164.ilike.*{d}" for d in last10])
            q = q.or_(or_clause)

        resp = q.execute()
        rows = resp.data or []
        for row in rows:
            matches.append({
                "user_id": row["user_id"],
                "username": row.get("username"),
                "full_name": row.get("full_name"),
                "avatar_url": row.get("avatar_url"),
                "phone_e164": row.get("phone_e164"),
            })

        print("[network] matched rows:", matches)
        return {"matches": matches}

    def follow(self, requester_id: UUID, target_user_id: UUID):
        """Create/ensure an accepted connection (idempotent)."""
        payload = {
            "requester_id": str(requester_id),
            "addressee_id": str(target_user_id),
            "status": "accepted",
        }

        # Some supabase-py versions don't support .select() after upsert.
        up = (
            self.client.table("connections")
            .upsert(payload, on_conflict="requester_id,addressee_id")
            .execute()
        )

        row = (getattr(up, "data", None) or [])
        if row:
            return row[0]

        # If upsert doesn't return a row, read it back
        sel = (
            self.client.table("connections")
            .select("*")
            .eq("requester_id", str(requester_id))
            .eq("addressee_id", str(target_user_id))
            .limit(1)
            .execute()
        )
        data = getattr(sel, "data", None) or []
        return (data[0] if data else payload)

    def import_and_follow(self, requester_id: UUID, emails: List[str], phones: List[str]) -> Dict[str, Any]:
        result = self.import_contacts(emails, phones)
        matched = result.get("matches", [])
        followed = 0
        for m in matched:
            uid = UUID(m["user_id"])
            if uid == requester_id:
                continue
            self.follow(requester_id, uid)
            followed += 1
        return {"matched": len(matched), "followed": followed, "matches": matched}
