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
  stake?: number;
  poolYes?: number;
  poolNo?: number;
  participantsYes?: number;
  participantsNo?: number;
  expiry?: string; // ISO string for expiration date
  userCommitment?: {
    choice: 'yes' | 'no';
    locked: boolean;
  };
}

export const mockSocialPosts: SocialPost[] = [
  {
    id: '1',
    username: 'Ivan Brennan',
    handle: '@ivanb',
    timestamp: '25m',
    content: 'Will I finish reading 3 books this month?',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=300&fit=crop',
    upvotes: 9230,
    downvotes: 12,
    stake: 20,
    poolYes: 80,
    poolNo: 40,
    participantsYes: 4,
    participantsNo: 2,
    expiry: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days
  },
  {
    id: '2',
    username: 'Beverly Williams',
    handle: '@bev',
    timestamp: '1hr',
    content: 'Will I wake up at 6 AM every day this week?',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    verified: true,
    upvotes: 49,
    downvotes: 2,
    stake: 15,
    poolYes: 30,
    poolNo: 45,
    participantsYes: 2,
    participantsNo: 3,
    expiry: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
  },
  {
    id: '3',
    username: 'pinsky.eth',
    handle: '@pinsky',
    timestamp: '2hr',
    content: 'Will I run 5 miles without stopping?',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop',
    verified: true,
    upvotes: 156,
    downvotes: 8,
    stake: 25,
    poolYes: 100,
    poolNo: 50,
    participantsYes: 4,
    participantsNo: 2,
    expiry: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
  },
  {
    id: '4',
    username: 'Alex Chen',
    handle: '@alexchen',
    timestamp: '3hr',
    content: 'Will I go to the gym 5 days this week?',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    upvotes: 89,
    downvotes: 3,
    stake: 10,
    poolYes: 45,
    poolNo: 25,
    participantsYes: 3,
    participantsNo: 2,
    expiry: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days
  },
  {
    id: '5',
    username: 'Sarah Kim',
    handle: '@sarahk',
    timestamp: '4hr',
    content: 'Will I complete my coding bootcamp project by Friday?',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    verified: true,
    upvotes: 234,
    downvotes: 5,
    stake: 15,
    poolYes: 60,
    poolNo: 30,
    participantsYes: 4,
    participantsNo: 2,
    expiry: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
  },
  {
    id: '6',
    username: 'Marcus Johnson',
    handle: '@marcusj',
    timestamp: '5hr',
    content: 'Will I finish learning React Native by the end of the month?',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop',
    upvotes: 120,
    downvotes: 15,
    stake: 30,
    poolYes: 90,
    poolNo: 60,
    participantsYes: 3,
    participantsNo: 2,
    expiry: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days
  },
  {
    id: '7',
    username: 'Emma Davis',
    handle: '@emmad',
    timestamp: '6hr',
    content: 'Will I meditate for 10 minutes every day this week?',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop',
    verified: true,
    upvotes: 67,
    downvotes: 4,
    stake: 12,
    poolYes: 36,
    poolNo: 24,
    participantsYes: 3,
    participantsNo: 2,
    expiry: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days
  },
  {
    id: '8',
    username: 'Tyler Brooks',
    handle: '@tylerb',
    timestamp: '7hr',
    content: 'Will I cook dinner at home 4 times this week instead of ordering out?',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=300&fit=crop',
    upvotes: 89,
    downvotes: 7,
    stake: 18,
    poolYes: 54,
    poolNo: 36,
    participantsYes: 3,
    participantsNo: 2,
    expiry: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
  },
];
