import { API_URL } from '../config';
import type { MeUpdate } from '../types';

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

export async function createProfile(accessToken: string, body: MeUpdate) {
  const r = await fetch(`${API_URL}/profiles`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

