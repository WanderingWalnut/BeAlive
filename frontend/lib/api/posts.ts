import { API_URL } from '../config';
import type { CreatePostRequest, PostWithCounts } from '../types';

export async function createPost(accessToken: string, body: CreatePostRequest): Promise<PostWithCounts> {
  const r = await fetch(`${API_URL}/posts`, {
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

export async function updatePostMedia(accessToken: string, postId: number, mediaUrl: string): Promise<PostWithCounts> {
  const r = await fetch(`${API_URL}/posts/${postId}/media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ media_url: mediaUrl }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

