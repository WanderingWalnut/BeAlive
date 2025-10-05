import { API_URL } from '../config';
import type { FeedResponse, ChallengeOut } from '../types';

export async function getFeed(accessToken: string, cursor?: string, limit = 20): Promise<FeedResponse> {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  params.append('limit', limit.toString());

  const url = `${API_URL}/feed?${params.toString()}`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getChallenge(accessToken: string, challengeId: number): Promise<ChallengeOut> {
  const r = await fetch(`${API_URL}/challenges/${challengeId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
