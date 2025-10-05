from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Dict, Optional
from uuid import UUID, uuid4

from app.models import PresignRequest, PresignResponse
from .supabase import get_supabase_client


class UploadService:
    """Generate signed upload URLs for the 'posts' storage bucket.

    Supabase Storage supports "signed upload URLs". They are used with HTTP POST, not PUT.
    We return method, headers, and the path to store on the post.
    """

    def __init__(self) -> None:
        self.client = get_supabase_client()

    def _build_path(self, user_id: UUID, post_id: int, ext: str) -> str:
        suffix = ext.lstrip('.').lower()
        now = datetime.now(timezone.utc)
        return f"posts/{user_id}/{post_id}/{int(now.timestamp())}_{uuid4().hex}.{suffix}"

    def presign(self, user_id: UUID, req: PresignRequest) -> PresignResponse:
        # Verify the post exists and is authored by the caller
        post = (
            self.client.table("posts").select("id,author_id").eq("id", req.post_id).limit(1).execute()
        )
        row = ((post.data or []) or [None])[0]
        if not row:
            raise ValueError("Post not found")
        if str(row.get("author_id")) != str(user_id):
            raise PermissionError("Not the post author")

        path = self._build_path(user_id, req.post_id, req.file_ext)

        # Create a signed upload URL via storage API
        storage = self.client.storage.from_("posts")
        result = storage.create_signed_upload_url(path)
        # supabase-py returns an object with 'signed_url' and 'token' typically
        signed_url = getattr(result, "signed_url", None) or result.get("signed_url")  # type: ignore[attr-defined]
        token = getattr(result, "token", None) or result.get("token")  # type: ignore[attr-defined]
        if not signed_url:
            # Some clients return dict: { data: { signedUrl, token } }
            data = getattr(result, "data", None) or {}
            signed_url = data.get("signedUrl")
            token = data.get("token")
        if not signed_url:
            raise RuntimeError("Failed to generate signed upload URL")

        headers: Dict[str, str] = {"x-upsert": "true" if req.upsert else "false"}
        if req.content_type:
            headers["Content-Type"] = req.content_type
        if token:
            # Signed upload requires Authorization: Bearer <token>
            headers["Authorization"] = f"Bearer {token}"

        # Expiry is managed server-side; we don't get an absolute time from API reliably.
        # Provide a hint (e.g., 2 minutes) for clients.
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=2)

        return PresignResponse(upload_url=signed_url, method="POST", headers=headers, path=path, expires_at=expires_at)

    def direct_upload(
        self,
        user_id: UUID,
        post_id: int,
        content: bytes,
        filename: Optional[str],
        content_type: Optional[str],
    ) -> str:
        """Upload bytes to Storage using service role, avoiding Storage RLS for clients.

        Validates the post ownership, builds a stable path, uploads the content, and returns the path.
        """
        # Validate post ownership
        post = self.client.table("posts").select("id,author_id").eq("id", post_id).limit(1).execute()
        row = ((post.data or []) or [None])[0]
        if not row:
            raise ValueError("Post not found")
        if str(row.get("author_id")) != str(user_id):
            raise PermissionError("Not the post author")

        # Derive extension
        ext = ""
        if filename and "." in filename:
            ext = filename.rsplit(".", 1)[-1].lower()
        if not ext and content_type:
            if content_type == "image/png":
                ext = "png"
            elif content_type == "image/jpeg" or content_type == "image/jpg":
                ext = "jpg"
        if not ext:
            ext = "bin"

        path = self._build_path(user_id, post_id, ext)

        # Upload using service role client (bypasses RLS)
        storage = self.client.storage.from_("posts")
        # storage3 library version in use requires header values as strings
        opts = {
            "upsert": "true",
            "contentType": (content_type or "application/octet-stream"),
        }
        storage.upload(path, content, opts)
        return path
