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
    content: 'Comic Sans.',
    upvotes: 9230,
    downvotes: 12,
  },
  {
    id: '2',
    username: 'Beverly Williams',
    handle: '@bev',
    timestamp: '1hr',
    content: 'Oh deer, look what I spotted today!',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    verified: true,
    upvotes: 49,
    downvotes: 2,
  },
  {
    id: '3',
    username: 'pinsky.eth',
    handle: '@pinsky',
    timestamp: '2hr',
    content: 'I could literally watch this for hours.',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop',
    verified: true,
    upvotes: 156,
    downvotes: 8,
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
  },
];
