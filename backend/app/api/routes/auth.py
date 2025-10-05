"""
Authentication endpoints
"""

import json
import urllib.request
from typing import Any, Dict, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Header, status

from app.core.config import settings
from app.services.supabase import get_supabase_client
from app.models import (
    ProfileOut,
    ProfileUpdate,
    MeSummary,
)
from app.services.aggregates import AggregatesService


def _extract_bearer_token(authorization: Optional[str]) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid Authorization header")
    return authorization.split(" ", 1)[1].strip()


def _get_supabase_user_from_token(access_token: str) -> Dict[str, Any]:
    if not settings.SUPABASE_URL:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="SUPABASE_URL not configured")
    api_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY
    if not api_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Supabase API key not configured")

    url = f"{settings.SUPABASE_URL}/auth/v1/user"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {access_token}")
    req.add_header("apikey", api_key)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code == 401:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from e
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Auth verification failed") from e
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Auth verification error") from e

    if not isinstance(payload, dict) or "id" not in payload:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unexpected auth response")
    return payload


router = APIRouter()


@router.get("/me")
async def get_current_user_profile(authorization: Optional[str] = Header(None)) -> Optional[ProfileOut]:
    """Return the current user's profile based on a Supabase JWT.

    Clients must send: Authorization: Bearer <access_token>
    """
    token = _extract_bearer_token(authorization)
    user_payload = _get_supabase_user_from_token(token)
    user_id = user_payload["id"]

    client = get_supabase_client()
    # Fetch profile row; if none exists, return null profile rather than creating
    profile_resp = client.table("profiles").select("*").eq("user_id", user_id).limit(1).execute()

    try:
        data = profile_resp.data  # type: ignore[attr-defined]
    except Exception:
        data = getattr(profile_resp, "data", None) or []

    profile: Optional[Dict[str, Any]] = data[0] if isinstance(data, list) and data else None
    return profile  # type: ignore[return-value]


@router.patch("/me")
async def update_current_user_profile(body: ProfileUpdate, authorization: Optional[str] = Header(None)) -> ProfileOut:
    """Update the current user's profile fields.

    Auth: same as GET /me; we use the Supabase JWT to derive user_id,
    then update `public.profiles` where `user_id = auth.uid()`.
    """
    token = _extract_bearer_token(authorization)
    user_payload = _get_supabase_user_from_token(token)
    user_id = user_payload["id"]

    # Only include provided fields
    update_fields: Dict[str, Any] = {}
    if body.username is not None:
        update_fields["username"] = body.username
    if body.full_name is not None:
        update_fields["full_name"] = body.full_name
    if body.avatar_url is not None:
        update_fields["avatar_url"] = body.avatar_url

    if not update_fields:
        # Nothing to update; return current
        client = get_supabase_client()
        resp = client.table("profiles").select("*").eq("user_id", user_id).limit(1).execute()
        data = getattr(resp, "data", None) or []
        profile = data[0] if isinstance(data, list) and data else None
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
        return profile  # type: ignore[return-value]

    client = get_supabase_client()
    # Upsert pattern to create the row if missing; relies on RLS allowing self-update
    # If you prefer to require pre-existence, replace with update().
    upsert_data = {"user_id": user_id, **update_fields}
    result = client.table("profiles").upsert(upsert_data, on_conflict="user_id").select("*").eq("user_id", user_id).limit(1).execute()

    data = getattr(result, "data", None) or []
    profile = data[0] if isinstance(data, list) and data else None
    if not profile:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update profile")
    return profile  # type: ignore[return-value]


@router.get("/me/summary", response_model=MeSummary)
async def get_me_summary(authorization: Optional[str] = Header(None)) -> MeSummary:
    """Return aggregate summary for the current user (followers, following, counts, totals)."""
    token = _extract_bearer_token(authorization)
    user_payload = _get_supabase_user_from_token(token)
    user_id = user_payload["id"]
    svc = AggregatesService()
    return svc.me_summary(UUID(user_id))


# Network endpoints have been moved to routes/network.py
