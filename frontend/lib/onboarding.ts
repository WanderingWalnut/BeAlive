import { supabase } from "./supabase";

export async function isOnboarded(): Promise<boolean> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return false; // unauthenticated

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return false;

  // Prefer a durable flag if you set it during ProfileSetup
  const flagged = Boolean((userData.user.user_metadata as any)?.onboarded);
  if (flagged) return true;

  // Fallback to DB row
  const uid = userData.user.id;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("user_id", uid)
    .single();

  if (error) return false;
  return Boolean(profile?.username && profile?.avatar_url);
}
