-- ==========================================================
--  BeAlive Supabase Schema (FastAPI + Supabase backend)
-- ==========================================================
-- 0) ENUM TYPES
do $$ begin if not exists (
    select 1
    from pg_type
    where typname = 'connection_status'
) then create type connection_status as enum ('pending', 'accepted', 'blocked');
end if;
if not exists (
    select 1
    from pg_type
    where typname = 'commitment_side'
) then create type commitment_side as enum ('for', 'against');
end if;
end $$;
-- ==========================================================
-- 1) PROFILES (mirror of auth.users)
-- ==========================================================
create table if not exists public.profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    username text unique,
    full_name text,
    avatar_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
-- updated_at trigger helper
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at := now();
return new;
end $$;
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before
update on public.profiles for each row execute function public.touch_updated_at();
alter table public.profiles enable row level security;
create policy "profiles_self_read" on public.profiles for
select to authenticated using (user_id = auth.uid());
create policy "profiles_self_update" on public.profiles for
update to authenticated using (user_id = auth.uid());
-- ==========================================================
-- 2) CONNECTIONS (mutual network)
-- ==========================================================
create table if not exists public.connections (
    id bigserial primary key,
    requester_id uuid not null references auth.users(id) on delete cascade,
    addressee_id uuid not null references auth.users(id) on delete cascade,
    status connection_status not null default 'pending',
    created_at timestamptz not null default now(),
    unique (requester_id, addressee_id),
    check (requester_id <> addressee_id)
);
alter table public.connections enable row level security;
create policy "connections_self_read" on public.connections for
select to authenticated using (
        requester_id = auth.uid()
        or addressee_id = auth.uid()
    );
create policy "connections_create" on public.connections for
insert to authenticated with check (requester_id = auth.uid());
create policy "connections_update_self" on public.connections for
update to authenticated using (
        requester_id = auth.uid()
        or addressee_id = auth.uid()
    );
-- Helper function: check if two users are connected (accepted either direction)
create or replace function public.is_connected(a uuid, b uuid) returns boolean language sql stable as $$
select exists (
        select 1
        from public.connections c
        where c.status = 'accepted'
            and (
                (
                    c.requester_id = a
                    and c.addressee_id = b
                )
                or (
                    c.requester_id = b
                    and c.addressee_id = a
                )
            )
    );
$$;
-- ==========================================================
-- 3) CHALLENGES
-- ==========================================================
create table if not exists public.challenges (
    id bigserial primary key,
    owner_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    description text,
    amount_cents integer not null check (amount_cents > 0),
    -- baseline amount for all commitments
    starts_at timestamptz,
    ends_at timestamptz,
    created_at timestamptz not null default now()
);
create index if not exists idx_challenges_owner on public.challenges(owner_id);
alter table public.challenges enable row level security;
-- Owner full CRUD
create policy "challenges_owner_crud" on public.challenges for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
-- Network read (public to the network)
create policy "challenges_network_read" on public.challenges for
select to authenticated using (
        owner_id = auth.uid()
        or public.is_connected(owner_id, auth.uid())
    );
-- ==========================================================
-- 4) POSTS (one per challenge, created by owner)
-- ==========================================================
create table if not exists public.posts (
    id bigserial primary key,
    challenge_id bigint not null references public.challenges(id) on delete cascade,
    author_id uuid not null references auth.users(id) on delete cascade,
    caption text,
    media_url text,
    created_at timestamptz not null default now()
);
create index if not exists idx_posts_challenge on public.posts(challenge_id);
create index if not exists idx_posts_author on public.posts(author_id);
create index if not exists idx_posts_created_at on public.posts(created_at desc);
alter table public.posts enable row level security;
-- Only owner can create posts for their challenge
create policy "posts_owner_create" on public.posts for
insert to authenticated with check (
        author_id = auth.uid()
        and exists (
            select 1
            from public.challenges ch
            where ch.id = posts.challenge_id
                and ch.owner_id = auth.uid()
        )
    );
-- Author can update/delete their own posts
create policy "posts_author_update" on public.posts for
update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "posts_author_delete" on public.posts for delete to authenticated using (author_id = auth.uid());
-- Network read (visible to network + owner)
create policy "posts_network_read" on public.posts for
select to authenticated using (
        author_id = auth.uid()
        or public.is_connected(author_id, auth.uid())
    );
-- ==========================================================
-- 5) COMMITMENTS (user interaction per challenge, immutable)
-- ==========================================================
create table if not exists public.commitments (
    id bigserial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    challenge_id bigint not null references public.challenges(id) on delete cascade,
    side commitment_side not null,
    -- 'for' or 'against'
    created_at timestamptz not null default now(),
    unique (user_id, challenge_id)
);
create index if not exists idx_commitments_challenge on public.commitments(challenge_id);
create index if not exists idx_commitments_user on public.commitments(user_id);
alter table public.commitments enable row level security;
-- Insert: only if user can see the challenge (owner or connected)
create policy "commitments_insert_once" on public.commitments for
insert to authenticated with check (
        user_id = auth.uid()
        and exists (
            select 1
            from public.challenges ch
            where ch.id = commitments.challenge_id
                and (
                    ch.owner_id = auth.uid()
                    or public.is_connected(ch.owner_id, auth.uid())
                )
        )
    );
-- Read: own or visible challenges
create policy "commitments_read_network" on public.commitments for
select to authenticated using (
        user_id = auth.uid()
        or exists (
            select 1
            from public.challenges ch
            where ch.id = commitments.challenge_id
                and (
                    ch.owner_id = auth.uid()
                    or public.is_connected(ch.owner_id, auth.uid())
                )
        )
    );
-- No update/delete → immutable
-- ==========================================================
-- 6) AGGREGATE VIEWS
-- ==========================================================
create or replace view public.challenge_stats as
select ch.id as challenge_id,
    ch.amount_cents,
    count(*) filter (
        where c.side = 'for'
    ) as for_count,
    count(*) filter (
        where c.side = 'against'
    ) as against_count,
    (
        count(*) filter (
            where c.side = 'for'
        )
    ) * ch.amount_cents as for_amount_cents,
    (
        count(*) filter (
            where c.side = 'against'
        )
    ) * ch.amount_cents as against_amount_cents
from public.challenges ch
    left join public.commitments c on c.challenge_id = ch.id
group by ch.id,
    ch.amount_cents;
create or replace view public.posts_with_counts as
select p.*,
    cs.for_count,
    cs.against_count,
    cs.for_amount_cents,
    cs.against_amount_cents
from public.posts p
    join public.challenge_stats cs on cs.challenge_id = p.challenge_id;
-- ==========================================================
-- 7) FEED RPC (My + Network posts)
-- ==========================================================
create or replace function public.get_feed(
        p_after timestamptz default null,
        p_limit int default 50
    ) returns setof public.posts_with_counts language sql stable security invoker
set search_path = public as $$
select p.*
from public.posts_with_counts as p
where (
        p.author_id = auth.uid()
        or public.is_connected(p.author_id, auth.uid())
    )
    and (
        p_after is null
        or p.created_at < p_after
    )
order by p.created_at desc
limit greatest(1, least(p_limit, 100));
$$;
grant execute on function public.get_feed(timestamptz, int) to authenticated;
-- ==========================================================
-- 8) SECURITY CLEANUP
-- ==========================================================
revoke all on all tables in schema public
from anon;
revoke all on all sequences in schema public
from anon;
revoke all on all functions in schema public
from anon;
grant usage on schema public to authenticated;
-- ==========================================================
-- 9) CONTACT IMPORT SUPPORT
-- ==========================================================
create table if not exists public.user_contacts (
    owner_id uuid not null references auth.users(id) on delete cascade,
    phone_e164 text not null,
    contact_name text,
    phone_hash text,
    matched_user_id uuid references auth.users(id) on delete
    set null,
        created_at timestamptz not null default now(),
        primary key (owner_id, phone_e164)
);
alter table public.user_contacts enable row level security;
create policy "contacts_owner_crud" on public.user_contacts for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
-- RPC: match a list of E.164 phone numbers to existing users and connect
-- Returns matched user ids
create or replace function public.match_contacts_and_connect(p_phones text []) returns setof uuid language plpgsql security definer
set search_path = public,
    auth as $$
declare r record;
begin for r in
select id
from auth.users
where phone = any(p_phones)
    and id <> auth.uid() loop
insert into public.connections (requester_id, addressee_id, status)
values (auth.uid(), r.id, 'accepted') on conflict (requester_id, addressee_id) do
update
set status = excluded.status;
return next r.id;
end loop;
return;
end;
$$;
grant execute on function public.match_contacts_and_connect(text []) to authenticated;
-- ==========================================================
-- 10) STORAGE: POSTS BUCKET + POLICIES (private; owner-only access)
-- ==========================================================
do $$ begin if not exists (
    select 1
    from storage.buckets
    where id = 'posts'
) then perform storage.create_bucket('posts', false);
end if;
end $$;
-- Ensure RLS is enabled on storage objects (usually enabled by default)
alter table if exists storage.objects enable row level security;
-- Reset and create owner-only policies on storage.objects for 'posts' bucket
drop policy if exists "posts_owner_select" on storage.objects;
drop policy if exists "posts_owner_insert" on storage.objects;
drop policy if exists "posts_owner_update" on storage.objects;
drop policy if exists "posts_owner_delete" on storage.objects;
create policy "posts_owner_select" on storage.objects for
select to authenticated using (
        bucket_id = 'posts'
        and owner = auth.uid()
    );
create policy "posts_owner_insert" on storage.objects for
insert to authenticated with check (
        bucket_id = 'posts'
        and owner = auth.uid()
    );
create policy "posts_owner_update" on storage.objects for
update to authenticated using (
        bucket_id = 'posts'
        and owner = auth.uid()
    ) with check (
        bucket_id = 'posts'
        and owner = auth.uid()
    );
create policy "posts_owner_delete" on storage.objects for delete to authenticated using (
    bucket_id = 'posts'
    and owner = auth.uid()
);
-- ==========================================================
-- 11) POSTS RPC: Atomic create with optional new challenge
-- ==========================================================
-- Guarantees: every post has a challenge via NOT NULL FK on posts.challenge_id
-- and this RPC either uses an owned challenge or creates one, then inserts the post.
create or replace function public.create_post_with_optional_challenge(
        p_challenge_id bigint default null,
        p_title text default null,
        p_description text default null,
        p_amount_cents integer default null,
        p_starts_at timestamptz default null,
        p_ends_at timestamptz default null,
        p_caption text default null,
        p_media_url text default null
    ) returns public.posts_with_counts language plpgsql security invoker
set search_path = public as $$
declare v_challenge_id bigint;
v_post_id bigint;
v_row public.posts_with_counts %rowtype;
begin if p_challenge_id is not null then v_challenge_id := p_challenge_id;
-- Ensure caller owns the target challenge
if not exists(
    select 1
    from public.challenges ch
    where ch.id = v_challenge_id
        and ch.owner_id = auth.uid()
) then raise exception 'Not the owner of the target challenge' using errcode = '42501';
end if;
else -- Creating a new challenge requires title and amount_cents
if p_title is null
or p_amount_cents is null then raise exception 'Missing new challenge fields: title and amount_cents are required' using errcode = '22023';
end if;
insert into public.challenges(
        owner_id,
        title,
        description,
        amount_cents,
        starts_at,
        ends_at
    )
values (
        auth.uid(),
        p_title,
        p_description,
        p_amount_cents,
        p_starts_at,
        p_ends_at
    )
returning id into v_challenge_id;
end if;
-- Create the post for the (existing or newly created) challenge
insert into public.posts(challenge_id, author_id, caption, media_url)
values (
        v_challenge_id,
        auth.uid(),
        p_caption,
        p_media_url
    )
returning id into v_post_id;
select p.* into v_row
from public.posts_with_counts p
where p.id = v_post_id;
return v_row;
end;
$$;
grant execute on function public.create_post_with_optional_challenge(
        bigint,
        text,
        text,
        integer,
        timestamptz,
        timestamptz,
        text,
        text
    ) to authenticated;