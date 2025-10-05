const API_URL = process.env.EXPO_PUBLIC_API_URL as string;

// Debug: log API base once at startup
// Note: do not log secrets; this is safe
// If undefined, requests will fail — surface an early warning
if (!API_URL) {
  // eslint-disable-next-line no-console
  console.warn("EXPO_PUBLIC_API_URL is not set");
} else {
  // eslint-disable-next-line no-console
  console.log("EXPO_PUBLIC_API_URL:", API_URL);
}

type MeUpdate = {
  username?: string;
  full_name?: string;
  avatar_url?: string;
};

export async function getMe(accessToken: string) {
  const r = await fetch(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function updateMe(accessToken: string, body: MeUpdate) {
  const r = await fetch(`${API_URL}/me`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}


