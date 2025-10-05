"""
Authentication endpoints
"""

import json
import urllib.request
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Header, status
from pydantic import BaseModel

from app.core.config import settings
from app.services.supabase import get_supabase_client


router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str


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


@router.get("/me")
async def get_current_user_profile(authorization: Optional[str] = Header(None)):
    """Return the current user's profile based on a Supabase JWT from the client.

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

    return {
        "user": {
            "id": user_id,
            "email": user_payload.get("email"),
            "phone": user_payload.get("phone"),
        },
        "profile": profile,
    }
