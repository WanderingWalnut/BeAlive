import { API_URL } from '../config';
import type { ChallengeOut } from '../types';

export async function getUserChallenges(accessToken: string): Promise<ChallengeOut[]> {
  const r = await fetch(`${API_URL}/challenges`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

