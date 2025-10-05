"""Shared auth helpers for extracting Supabase user from JWT.

These helpers are used by multiple route modules. They rely on SUPABASE_URL and
either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY to validate the token via
`/auth/v1/user`.
"""

from __future__ import annotations

import json
import urllib.request
from typing import Any, Dict, Optional

from fastapi import HTTPException, status

from app.core.config import settings


def extract_bearer_token(authorization: Optional[str]) -> str:
    """Extract Bearer token from Authorization header."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid Authorization header")
    return authorization.split(" ", 1)[1].strip()


def get_supabase_user_from_token(access_token: str) -> Dict[str, Any]:
    """Call Supabase Auth `/auth/v1/user` to get the user payload for a token."""
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

