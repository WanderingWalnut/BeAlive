import { Challenge, User } from '../types/challenge';

export const mockUser: User = {
  id: 'user-1',
  username: 'captainwhitaker',
  profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  phone: '+1234567890',
  verified: true,
  createdAt: '2024-01-01T00:00:00Z'
};

export const mockChallenges: Challenge[] = [
  {
    id: 'challenge-1',
    creator: {
      id: 'user-2',
      username: 'alex_fitness',
      profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      verified: false
    },
    title: 'Gym 5 days this week',
    description: 'Will I actually go to the gym 5 days this week?',
    snapshot: {
      frontCamera: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop',
      backCamera: 'https://images.unsplash.com/photo-1534258936927-c3712cd0a4b5?w=400&h=600&fit=crop'
    },
    stake: 10,
    expiry: '2024-01-15T23:59:59Z',
    location: 'Townsend, United States',
    createdAt: '2024-01-08T12:00:00Z',
    status: 'active',
    pool: {
      yes: { amount: 50, participants: 5 },
      no: { amount: 30, participants: 3 }
    },
    userCommitment: {
      choice: 'yes',
      amount: 10,
      locked: true,
      committedAt: '2024-01-08T14:30:00Z'
    },
    updates: [
      {
        id: 'update-1',
        challengeId: 'challenge-1',
        creatorId: 'user-2',
        content: 'Day 1 ✅ - Leg day complete!',
        image: 'https://images.unsplash.com/photo-1534258936927-c3712cd0a4b5?w=300&h=300&fit=crop',
        createdAt: '2024-01-09T18:00:00Z'
      }
    ]
  },
  {
    id: 'challenge-2',
    creator: {
      id: 'user-3',
      username: 'sarah_writer',
      profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      verified: true
    },
    title: 'Finish my novel draft',
    description: 'Will I complete the first draft of my novel by month end?',
    snapshot: {
      frontCamera: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop',
      backCamera: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop'
    },
    stake: 25,
    expiry: '2024-01-31T23:59:59Z',
    location: 'San Francisco, CA',
    createdAt: '2024-01-10T09:00:00Z',
    status: 'active',
    pool: {
      yes: { amount: 100, participants: 4 },
      no: { amount: 75, participants: 3 }
    },
    userCommitment: undefined, // User hasn't committed yet
    updates: []
  },
  {
    id: 'challenge-3',
    creator: {
      id: 'user-4',
      username: 'mike_runner',
      profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      verified: false
    },
    title: 'Run a marathon',
    description: 'Will I complete my first marathon this year?',
    snapshot: {
      frontCamera: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop',
      backCamera: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=600&fit=crop'
    },
    stake: 50,
    expiry: '2024-12-31T23:59:59Z',
    location: 'New York, NY',
    createdAt: '2024-01-05T15:30:00Z',
    status: 'active',
    pool: {
      yes: { amount: 200, participants: 4 },
      no: { amount: 150, participants: 3 }
    },
    userCommitment: {
      choice: 'no',
      amount: 50,
      locked: true,
      committedAt: '2024-01-06T10:15:00Z'
    },
    updates: [
      {
        id: 'update-2',
        challengeId: 'challenge-3',
        creatorId: 'user-4',
        content: 'Training update: 15 miles today!',
        image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=300&fit=crop',
        createdAt: '2024-01-11T16:45:00Z'
      }
    ]
  }
];
