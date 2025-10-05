# BeAlive Backend API - Next Phase Roadmap

## Overview

This document outlines the next phase of API development for the BeAlive backend (FastAPI + Supabase). We will implement the API in phases, focusing on clear contracts, minimal coupling, and leveraging Supabase Auth, Postgres, and Storage.

## Tech Stack

- FastAPI (Python) for HTTP API
- Supabase (Auth, Postgres, RLS, Storage)
- Supabase Python client

## Environment

Required env vars (backend):

- `SUPABASE_URL`
- `SUPABASE_KEY` (anon key; fallback only)
- `SUPABASE_SERVICE_ROLE_KEY` (preferred for backend)
- `DATABASE_URL` (Postgres connection string for migrations)

Install deps:

```
/Users/naveed/BeAlive/backend/venv/bin/pip install -r /Users/naveed/BeAlive/backend/requirements.txt
```

Run dev server:

```
/Users/naveed/BeAlive/backend/venv/bin/uvicorn app.main:app --reload --port 8000
```

## Database & Storage

- Migrations live under `supabase/migrations/` and can be applied with `supabase db push`.
- Core tables: `profiles`, `connections`, `challenges`, `posts`, `commitments`.
- Views/RPC: `posts_with_counts`, `challenge_stats`, `get_feed`, `match_contacts_and_connect(text[])`.
- Storage: private `posts` bucket with owner-only policies. Store object path in `posts.media_url`; serve via signed URLs.

## High-Level Entities

- `user_id` (from Supabase auth)
- `challenge_id`, `post_id`, `commitment_id`, `relationship_id`

## API Structure (proposed files)

```
backend/app/
  main.py
  api/
    router.py
    feed.py
    challenges.py
    posts.py
    commitments.py
    network.py
    uploads.py
  core/
    config.py
    db.py
    deps.py
  models/
    challenge.py
    post.py
    commitment.py
    common.py
  services/
    challenges.py
    posts.py
    commitments.py
    feed.py
    uploads.py
```

## Phase Plan

Phase 1: Schema + Client

- Supabase client/service initialized (lazy singleton)
- Schema, RLS, views, and RPCs in place
- Storage bucket `posts` created with policies

Phase 2: Network + Feed (MVP)

- POST `/v1/network/import-contacts` → normalize phones, call `match_contacts_and_connect`
- POST `/v1/network/follow`, DELETE `/v1/network/follow/{user_id}`
- GET `/v1/network` → followers/following
- GET `/v1/feed` → network posts (cursor, limit, since)

Phase 3: Challenges

- POST `/v1/challenges` → create challenge
- GET `/v1/challenges/{challenge_id}` → details + aggregates
- PATCH `/v1/challenges/{challenge_id}` → edit metadata (locked after first commitment)
- GET `/v1/challenges/{challenge_id}/posts` → paginated
- GET `/v1/challenges` → filters: creator_id, active, cursor, limit

Phase 4: Posts

- POST `/v1/posts` → create (optionally create new challenge atomically)
- GET `/v1/posts/{post_id}` → post + aggregates + author
- DELETE `/v1/posts/{post_id}` → author-only delete

Phase 5: Commitments

- POST `/v1/challenges/{challenge_id}/commitments` → idempotent one-per-user
- GET `/v1/challenges/{challenge_id}/commitments/me`
- GET `/v1/challenges/{challenge_id}/commitments` (admin/analytics)

Phase 6: Aggregates & Status

- GET `/v1/challenges/{challenge_id}/stats`
- GET `/v1/me/summary`

Phase 7: Uploads

- POST `/v1/uploads/presign` → presigned PUT to `posts` bucket
- Clients PUT to `upload_url`; backend stores `media_url` on post

## Optional Phases

- Discovery: GET `/v1/feed/challenges/trending`, `/v1/challenges/search`
- Moderation/Admin: hide posts, lock challenges, list flags
- Webhooks: storage processing, payments

## Contracts (selected)

Profiles & Network

- GET `/v1/me` → current profile
- PATCH `/v1/me` → update handle, display_name, bio, privacy
- POST `/v1/network/import-contacts` → { phones: string[] } → matches: user_id[]
- POST `/v1/network/follow` → { target_user_id }
- DELETE `/v1/network/follow/{target_user_id}`
- GET `/v1/network` → { following[], followers[], counts }

Feed & Discovery

- GET `/v1/feed` → { items, next_cursor }
- GET `/v1/feed/challenges/trending`
- GET `/v1/users/{user_id}/posts`
- GET `/v1/challenges/search`

Challenges

- POST `/v1/challenges` → { title, description, amount_cents, ends_at, visibility }
- GET `/v1/challenges/{challenge_id}` → aggregates included
- PATCH `/v1/challenges/{challenge_id}` (pre-commitments only for critical fields)
- GET `/v1/challenges/{challenge_id}/posts`
- GET `/v1/challenges` → filters

Posts

- POST `/v1/posts` → { challenge_id | new_challenge, media: {front_url, back_url}, caption }
- GET `/v1/posts/{post_id}`
- DELETE `/v1/posts/{post_id}`

Commitments

- POST `/v1/challenges/{challenge_id}/commitments` → { direction, idempotency_key }
- GET `/v1/challenges/{challenge_id}/commitments/me`
- GET `/v1/challenges/{challenge_id}/commitments`

Uploads

- POST `/v1/uploads/presign` → { file_name, content_type, purpose }
  - Returns `{ upload_url, public_url (or key), expires_at }`

## Server Rules

- Enforce one commitment per (user_id, challenge_id); return 409 on duplicate
- Commitments immutable; amount derived from challenge.amount_cents
- Post creation tied to an existing or newly created challenge (atomic)
- Feed defaults to network scope; aggregates from views

## Testing the Supabase Client

```py
from app.services.supabase import get_supabase_client
client = get_supabase_client()
client.storage.list_buckets()
```

## Migrations

Apply migrations:

```
supabase db push
```

## Notes

- Phone auth: matching uses `auth.users.phone` via `match_contacts_and_connect(text[])`.
- Storage `posts` bucket: keep private; serve via signed URLs.
