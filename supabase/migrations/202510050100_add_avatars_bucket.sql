-- ==========================================================
--  AVATARS STORAGE: bucket + policies
-- ==========================================================
do $$ begin if not exists (
    select 1
    from storage.buckets
    where id = 'avatars'
) then perform storage.create_bucket('avatars', true);
-- public bucket for easy avatar access
else -- Update existing bucket to be public
update storage.buckets
set public = true
where id = 'avatars';
end if;
end $$;
-- Note: On Supabase Cloud, only the table owner can ALTER storage.objects.
-- RLS is already enabled by default; skip altering the table here.
-- Reset any existing avatar policies (idempotent)
drop policy if exists "avatars_public_select" on storage.objects;
drop policy if exists "avatars_owner_insert" on storage.objects;
drop policy if exists "avatars_owner_update" on storage.objects;
drop policy if exists "avatars_owner_delete" on storage.objects;
-- Read: allow any authenticated user to read avatar images
create policy "avatars_public_select" on storage.objects for
select to authenticated using (bucket_id = 'avatars');
-- Insert: only the owner (uploader) can upload to their own objects
create policy "avatars_owner_insert" on storage.objects for
insert to authenticated with check (
        bucket_id = 'avatars'
        and owner = auth.uid()
    );
-- Update: only the owner can update their own objects
create policy "avatars_owner_update" on storage.objects for
update to authenticated using (
        bucket_id = 'avatars'
        and owner = auth.uid()
    ) with check (
        bucket_id = 'avatars'
        and owner = auth.uid()
    );
-- Delete: only the owner can delete their own objects
create policy "avatars_owner_delete" on storage.objects for delete to authenticated using (
    bucket_id = 'avatars'
    and owner = auth.uid()
);