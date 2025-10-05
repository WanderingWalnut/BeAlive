-- Quick fix for storage uploads with presigned URLs
-- Remove owner check from insert policy to allow authenticated uploads
drop policy if exists "posts_owner_insert" on storage.objects;
create policy "posts_owner_insert" on storage.objects for
insert to authenticated with check (
        bucket_id = 'posts' -- Allow any authenticated user to upload (quick hackathon fix)
    );