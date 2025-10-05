-- ==========================================================
--  Allow reading profiles of network connections
-- ==========================================================
-- Add a new policy to allow reading profiles of users you're connected to
create policy "profiles_network_read" on public.profiles for
select to authenticated using (
        user_id = auth.uid()
        or public.is_connected(user_id, auth.uid())
    );