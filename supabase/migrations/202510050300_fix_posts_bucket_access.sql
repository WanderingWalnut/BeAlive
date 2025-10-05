-- ==========================================================
-- Fix posts bucket access for social feed
-- ==========================================================
-- Make posts bucket public so images can be viewed by all authenticated users
-- This is appropriate for a social feed where posts are meant to be shared
update storage.buckets
set public = true
where id = 'posts';
-- Update the select policy to allow all authenticated users to view posts
-- This matches the social nature of the app where posts in the feed are viewable
drop policy if exists "posts_owner_select" on storage.objects;
drop policy if exists "posts_network_select" on storage.objects;
create policy "posts_public_select" on storage.objects for
select to authenticated using (bucket_id = 'posts');