import { useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../providers/AuthProvider';
import { getMe, updateMe, createProfile } from '../lib/api';

const PROFILE_CACHE_KEY = '@profile_cache';
const PROFILE_TIMESTAMP_KEY = '@profile_cache_timestamp';

// Global cache to store profile data across all components
let cachedProfile: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let isLoadingFromStorage = false;

// Load from AsyncStorage on app start (only once)
async function loadFromAsyncStorage() {
  if (isLoadingFromStorage) return;
  isLoadingFromStorage = true;
  
  try {
    const [cachedData, cachedTime] = await Promise.all([
      AsyncStorage.getItem(PROFILE_CACHE_KEY),
      AsyncStorage.getItem(PROFILE_TIMESTAMP_KEY),
    ]);
    
    if (cachedData && cachedTime) {
      cachedProfile = JSON.parse(cachedData);
      cacheTimestamp = parseInt(cachedTime, 10);
      console.log('✓ Profile loaded from AsyncStorage');
    }
  } catch (err) {
    console.error('Error loading profile from AsyncStorage:', err);
  }
}

// Save to AsyncStorage
async function saveToAsyncStorage(profile: any) {
  try {
    await Promise.all([
      AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile)),
      AsyncStorage.setItem(PROFILE_TIMESTAMP_KEY, Date.now().toString()),
    ]);
    console.log('✓ Profile saved to AsyncStorage');
  } catch (err) {
    console.error('Error saving profile to AsyncStorage:', err);
  }
}

export function useMe() {
  const { accessToken } = useAuth();
  const [me, setMe] = useState<any>(cachedProfile); // Initialize with cached data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const hasLoadedFromStorage = useRef(false);

  const refresh = useCallback(async (force = false) => {
    if (!accessToken) return;

    // Check cache validity
    const now = Date.now();
    const isCacheValid = cachedProfile && (now - cacheTimestamp) < CACHE_DURATION;

    if (isCacheValid && !force) {
      // Cache is still valid, no need to fetch
      setMe(cachedProfile);
      return;
    }

    // Prevent duplicate simultaneous fetches
    if (loadingRef.current) {
      console.log('⏳ Profile fetch already in progress, skipping...');
      return;
    }
    loadingRef.current = true;

    try {
      setLoading(true);
      setError(null);
      const cacheAge = cachedProfile ? Math.round((now - cacheTimestamp) / 1000) : 0;
      console.log(`⬇ Fetching profile from API... (cache age: ${cacheAge}s)`);
      const res = await getMe(accessToken);
      
      // Only update if data has changed
      const currentData = JSON.stringify(me);
      const newData = JSON.stringify(res);
      
      if (currentData !== newData) {
        setMe(res);
        // Update global cache
        cachedProfile = res;
        cacheTimestamp = Date.now();
        // Save to AsyncStorage for persistence
        await saveToAsyncStorage(res);
        console.log('✓ Profile fetched and cached for 5 minutes');
      } else {
        console.log('✓ Profile unchanged, no update needed');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load profile');
      console.error('❌ Error fetching profile:', e?.message);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [accessToken, me]);

  const save = useCallback(async (body: { username?: string; full_name?: string; avatar_url?: string }) => {
    if (!accessToken) throw new Error('Not authenticated');
    const res = await updateMe(accessToken, body);
    setMe(res);
    // Update cache with new data
    cachedProfile = res;
    cacheTimestamp = Date.now();
    // Save to AsyncStorage
    await saveToAsyncStorage(res);
    return res;
  }, [accessToken]);

  const create = useCallback(async (body: { username?: string; full_name?: string; avatar_url?: string }) => {
    if (!accessToken) throw new Error('Not authenticated');
    const res = await createProfile(accessToken, body);
    setMe(res);
    // Update cache with new data
    cachedProfile = res;
    cacheTimestamp = Date.now();
    // Save to AsyncStorage
    await saveToAsyncStorage(res);
    return res;
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    
    // Load from AsyncStorage first (only once)
    if (!hasLoadedFromStorage.current) {
      hasLoadedFromStorage.current = true;
      loadFromAsyncStorage().then(() => {
        // After loading from AsyncStorage, sync state
        if (cachedProfile && me !== cachedProfile) {
          setMe(cachedProfile);
        }
        
        // Then check if we need to refresh from API
        const now = Date.now();
        const isCacheValid = cachedProfile && (now - cacheTimestamp) < CACHE_DURATION;
        
        if (!isCacheValid) {
          console.log('📡 Cache invalid or empty, fetching profile from API...');
          refresh();
        } else {
          console.log('✓ Using cached profile (valid for ' + Math.round((CACHE_DURATION - (now - cacheTimestamp)) / 1000) + 's more)');
        }
      });
    }
  }, [accessToken]); // Only re-run when token changes, not on every mount

  return { me, loading, error, refresh, save, create };
}

// Function to clear the cache (useful for logout)
export async function clearProfileCache() {
  cachedProfile = null;
  cacheTimestamp = 0;
  isLoadingFromStorage = false;
  
  // Clear AsyncStorage
  try {
    await Promise.all([
      AsyncStorage.removeItem(PROFILE_CACHE_KEY),
      AsyncStorage.removeItem(PROFILE_TIMESTAMP_KEY),
    ]);
    console.log('✓ Profile cache cleared from AsyncStorage');
  } catch (err) {
    console.error('Error clearing profile cache from AsyncStorage:', err);
  }
}


