const API_URL = process.env.EXPO_PUBLIC_API_URL as string;

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


