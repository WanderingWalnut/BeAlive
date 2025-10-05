import { API_URL } from '../config';
import type { CommitmentOut, CommitmentRequest } from '../types';

/**
 * Create a commitment for a challenge
 * @param token - Access token
 * @param challengeId - Challenge ID
 * @param direction - 'for' or 'against'
 * @param idempotencyKey - Optional idempotency key
 */
export async function createCommitment(
  token: string,
  challengeId: number,
  direction: 'for' | 'against',
  idempotencyKey?: string
): Promise<CommitmentOut> {
  const body: CommitmentRequest = {
    direction,
    idempotency_key: idempotencyKey,
  };
  
  const r = await fetch(`${API_URL}/challenges/${challengeId}/commitments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/**
 * Get the user's commitment for a specific challenge (if exists)
 * @param token - Access token
 * @param challengeId - Challenge ID
 * @returns The user's commitment or null if not found
 */
export async function getMyCommitment(
  token: string,
  challengeId: number
): Promise<CommitmentOut | null> {
  const r = await fetch(`${API_URL}/challenges/${challengeId}/commitments/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  // If 404, user hasn't committed yet
  if (r.status === 404) {
    return null;
  }
  
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/**
 * Get all commitments for the current user
 * @param token - Access token
 * @returns List of user's commitments
 */
export async function getMyCommitments(
  token: string
): Promise<CommitmentOut[]> {
  const r = await fetch(`${API_URL}/commitments/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
