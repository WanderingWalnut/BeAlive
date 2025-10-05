import { API_URL } from '../config';
import type { PresignRequest, PresignResponse, DirectUploadResponse } from '../types';

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
  const form = new FormData();
  const name = imageUri.split('/')?.pop() || `upload.${contentType === 'image/png' ? 'png' : 'jpg'}`;
  form.append('file' as any, { uri: imageUri, name, type: contentType } as any);

  const hdrs = { ...headers } as Record<string, string>;
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

