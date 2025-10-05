// Shared API models and types

export type MeUpdate = {
  username?: string;
  full_name?: string;
  avatar_url?: string;
};

export type ProfileOut = {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type CreatePostRequest = {
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

export type PostWithCounts = {
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

export type FeedResponse = {
  items: PostWithCounts[];
  next_cursor: string | null;
};

export type PresignRequest = {
  post_id: number;
  file_ext: string;
  content_type?: string;
  upsert?: boolean;
};

export type PresignResponse = {
  upload_url: string;
  method: string;
  headers: Record<string, string>;
  path: string;
  expires_at?: string;
};

export type DirectUploadResponse = { path: string };

export type ChallengeOut = {
  id: number;
  owner_id: string;
  title: string;
  description: string | null;
  amount_cents: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

