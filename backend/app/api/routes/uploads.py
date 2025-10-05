"""
Uploads endpoints.

Provides a presigned upload URL for Supabase Storage 'posts' bucket. Clients then upload
directly to Storage using the returned URL, and include the returned 'path' as the media_url
when creating or updating a post.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Header, File, Form, UploadFile

from app.models import PresignRequest, PresignResponse
from app.services.uploads import UploadService
from app.utils.auth import extract_bearer_token, get_supabase_user_from_token


router = APIRouter()


def _current_user_id(authorization: str | None = Header(None)) -> UUID:
    token = extract_bearer_token(authorization)
    user_payload = get_supabase_user_from_token(token)
    return UUID(user_payload["id"])  # type: ignore[arg-type]


@router.post("/uploads/presign", response_model=PresignResponse)
async def presign_upload(body: PresignRequest, user_id: UUID = Depends(_current_user_id)):
    """Return a signed upload URL for the authenticated user and a specific post.

    The response includes:
    - upload_url: where to POST the file
    - method + headers: how to call it (include Content-Type and x-upsert)
    - path: the storage key to persist as media_url on the given post
    """
    svc = UploadService()
    return svc.presign(user_id=user_id, req=body)


@router.post("/uploads/direct")
async def direct_upload(
    post_id: int = Form(..., ge=1),
    file: UploadFile = File(...),
    user_id: UUID = Depends(_current_user_id),
):
    """Upload the file via backend using the service role, bypassing Storage RLS.

    Returns: { path: string } to be saved as media_url via PATCH /posts/{id}/media.
    """
    svc = UploadService()
    try:
        content = await file.read()
        path = svc.direct_upload(
            user_id=user_id,
            post_id=post_id,
            content=content,
            filename=file.filename,
            content_type=file.content_type,
        )
        return {"path": path}
    except PermissionError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))
