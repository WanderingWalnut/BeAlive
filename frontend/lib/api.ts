// Prefer explicit EXPO_PUBLIC_API_URL. Fallback to local dev defaults.
let API_URL = process.env.EXPO_PUBLIC_API_URL as string | undefined;
if (!API_URL || API_URL.trim().length === 0) {
  API_URL = 'http://127.0.0.1:8000/api/v1';
}

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

// Posts API

type CreatePostRequest = {
  challenge_id?: number;
  new_challenge?: {
    title: string;
    description?: string;
    amount_cents: number;
    starts_at?: string;
    ends_at?: string;
  };
  caption?: string;
  media_url?: string;
};

type PostWithCounts = {
  id: number;
  challenge_id: number;
  author_id: string;
  caption: string | null;
  media_url: string | null;
  created_at: string;
  for_count: number;
  against_count: number;
  for_amount_cents: number;
  against_amount_cents: number;
};

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

type PresignRequest = {
  post_id: number;
  file_ext: string;
  content_type?: string;
  upsert?: boolean;
};

type PresignResponse = {
  upload_url: string;
  method: string;
  headers: Record<string, string>;
  path: string;
  expires_at?: string;
};

export async function getPresignedUploadUrl(accessToken: string, body: PresignRequest): Promise<PresignResponse> {
  const r = await fetch(`${API_URL}/uploads/presign`, {
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

export async function uploadImage(
  uploadUrl: string,
  imageUri: string,
  contentType: string,
  headers: Record<string, string>
) {
  // Signed upload expects multipart/form-data with a 'file' field.
  // In React Native/Expo, use FormData with a file-like object { uri, name, type }.
  const form = new FormData();
  const name = (imageUri.split('/')?.pop() || `upload.${contentType === 'image/png' ? 'png' : 'jpg'}`);
  form.append('file' as any, { uri: imageUri, name, type: contentType } as any);

  // Do not set 'Content-Type' manually; let fetch set the multipart boundary.
  const hdrs = { ...headers };
  delete (hdrs as any)['Content-Type'];

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: hdrs,
    body: form,
  });

  if (!uploadResponse.ok) {
    let extra = '';
    try { extra = await uploadResponse.text(); } catch {}
    throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText} ${extra}`.trim());
  }
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

type DirectUploadResponse = { path: string };

export async function directUpload(
  accessToken: string,
  postId: number,
  imageUri: string,
  contentType: string
): Promise<DirectUploadResponse> {
  const form = new FormData();
  form.append('post_id', String(postId));
  const name = imageUri.split('/')?.pop() || `upload.${contentType === 'image/png' ? 'png' : 'jpg'}`;
  form.append('file' as any, { uri: imageUri, name, type: contentType } as any);

  const r = await fetch(`${API_URL}/uploads/direct`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    } as any,
    body: form,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// Challenges API

type ChallengeOut = {
  id: number;
  owner_id: string;
  title: string;
  description: string | null;
  amount_cents: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

export async function getUserChallenges(accessToken: string): Promise<ChallengeOut[]> {
  const r = await fetch(`${API_URL}/challenges`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
