import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { getMe, updateMe, createProfile } from '../lib/api';

export function useMe() {
  const { accessToken } = useAuth();
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getMe(accessToken);
      setMe(res);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const save = useCallback(async (body: { username?: string; full_name?: string; avatar_url?: string }) => {
    if (!accessToken) throw new Error('Not authenticated');
    const res = await updateMe(accessToken, body);
    setMe(res);
    return res;
  }, [accessToken]);

  const create = useCallback(async (body: { username?: string; full_name?: string; avatar_url?: string }) => {
    if (!accessToken) throw new Error('Not authenticated');
    const res = await createProfile(accessToken, body);
    setMe(res);
    return res;
  }, [accessToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { me, loading, error, refresh, save, create };
}


