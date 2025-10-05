# TODO: Uploads Flow (Presign → Upload → Patch)

This tracks the frontend work to integrate Phase 7 uploads with the backend.

- Wire API helpers in `frontend/lib/api.ts`:
  - `presignUpload(accessToken, { post_id, file_ext, content_type }) -> { upload_url, headers, path }`
  - `patchPostMedia(accessToken, postId, { media_url }) -> PostWithCounts`
  - Keep existing `createPost` (but do not send media_url on create).

- Implement client flow (Option B, safer):
  1) Create post first (optionally creating new challenge atomically) via `POST /api/v1/posts`.
     - Capture `post_id` from response.
  2) Call `POST /api/v1/uploads/presign` with `{ post_id, file_ext, content_type }`.
     - Receive `upload_url`, `headers`, and `path`.
  3) Upload file bytes directly to `upload_url` using `fetch` (method: `POST`) with provided headers.
     - For images: set `Content-Type` to `image/jpeg` or appropriate type.
  4) After successful upload, call `PATCH /api/v1/posts/{post_id}/media` with `{ media_url: path }`.

- UI/UX tasks:
  - Show uploading state and progress (disable submit until media is patched or show placeholder).
  - Handle failures with retry on steps 2–4.
  - If final patch fails, provide a retry action; post remains valid without media.

- Error handling & cleanup:
  - If upload (step 3) fails, nothing to clean in DB (post exists); allow retry or delete post.
  - If you implement a "cancel" action, optionally delete the post, and consider removing any uploaded object (if it succeeded) via `supabase.storage.from('posts').remove([path])`.

- Storage details:
  - Backend generates storage paths under `posts/{user_id}/{post_id}/...`.
  - Upload uses Supabase signed upload URL (HTTP POST), not PUT.
  - Do not expose service keys; uploads rely on the user session.

- Configuration sanity:
  - Ensure `EXPO_PUBLIC_API_URL` includes `/api/v1` and points to a reachable host for the device:
    - iOS simulator: `http://127.0.0.1:8000/api/v1`
    - Android emulator: `http://10.0.2.2:8000/api/v1`
    - Real device: `http://10.0.0.99:8000/api/v1`
  - Ensure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set.

- Future enhancements:
  - Background upload with progress callbacks.
  - Show a temporary local preview before patching media_url.
  - Optional: Remove storage objects when deleting posts (client convenience), server already enforces owner-only access.

