export interface SocialPost {
  id: string;
  username: string;
  handle: string;
  timestamp: string;
  content: string;
  image?: string;
  verified?: boolean;
  upvotes: number;
  comments: number;
}

export const mockSocialPosts: SocialPost[] = [
  {
    id: '1',
    username: 'Ivan Brennan',
    handle: '@ivanb',
    timestamp: '25m',
    content: 'Comic Sans.',
    upvotes: 9230,
    comments: 92,
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
    comments: 11,
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
    comments: 23,
  },
  {
    id: '4',
    username: 'Alex Chen',
    handle: '@alexchen',
    timestamp: '3hr',
    content: 'Just finished my morning workout. Feeling energized! 💪',
    upvotes: 89,
    comments: 7,
  },
  {
    id: '5',
    username: 'Sarah Kim',
    handle: '@sarahk',
    timestamp: '4hr',
    content: 'Beautiful sunset from my balcony tonight.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    verified: true,
    upvotes: 234,
    comments: 18,
  },
];
