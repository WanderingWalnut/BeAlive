import { Update } from '../types/update';

export interface SocialPost {
  id: string;
  username: string;
  handle: string;
  timestamp: string;
  content: string;
  image?: string;
  verified?: boolean;
  upvotes: number;
  downvotes: number;
  // Betting properties
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
