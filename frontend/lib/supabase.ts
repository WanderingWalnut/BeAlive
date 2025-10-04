import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lqmlvuwidtgppfwzzorp.supabase.co/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbWx2dXdpZHRncHBmd3p6b3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1OTUyOTQsImV4cCI6MjA3NTE3MTI5NH0.LLX1mkc1qFPNhffbWqZ4XXXuLT1g8xNg2FjEt4t3Gt4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // optional but recommended on RN
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // RN doesn’t use URL callbacks
  },
});