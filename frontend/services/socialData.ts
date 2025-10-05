import { Update } from '../types/update';

export interface SocialPost {
  id: string;
  challengeId: number; // Added to track the challenge for commitments
  username: string;
  handle: string;
  avatar?: string | null; // Avatar URL or null
  userInitial?: string; // First letter of username/full_name for fallback
  timestamp: string;
  content: string;
  image?: string;
  verified?: boolean;
  upvotes: number;
  downvotes: number;
  // Commitment-related properties
  stake: number;
  poolYes: number;
  poolNo: number;
  participantsYes: number;
  participantsNo: number;
  expiry: string; // ISO string for expiration date
  userCommitment?: {
    choice: 'yes' | 'no';
    locked: boolean;
  };
  updates?: Update[];
}

export const mockSocialPosts: SocialPost[] = [];
