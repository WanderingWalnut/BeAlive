from typing import Optional

from supabase import Client, create_client

from app.core.config import settings


class SupabaseService:
    """Create and manage a singleton Supabase client instance.
    This class defers client creation until first use so imports remain cheap and
    configuration issues surface when the client is actually needed.
    """

    def __init__(self, supabase_url: str, supabase_key: str) -> None:
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and a key must be provided")
        self._supabase_url: str = supabase_url
        self._supabase_key: str = supabase_key
        self._client: Optional[Client] = None

    def get_client(self) -> Client:
        """Return the Supabase client, creating it on first access."""
        if self._client is None:
            self._client = create_client(self._supabase_url, self._supabase_key)
        return self._client


# Module-level singleton holder
_supabase_service: Optional[SupabaseService] = None


def get_supabase_service() -> SupabaseService:
    """Return a lazily-initialized SupabaseService singleton.

    Prefer the service role key on the backend. Fallback to anon key for local
    development if the service role key is not present.
    """
    global _supabase_service
    if _supabase_service is None:
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY
        _supabase_service = SupabaseService(settings.SUPABASE_URL, key)
    return _supabase_service


def get_supabase_client() -> Client:
    """Convenience accessor to the singleton Supabase client."""
    return get_supabase_service().get_client()


__all__ = [
    "SupabaseService",
    "get_supabase_service",
    "get_supabase_client",
]




