export interface Challenge {
  id: string;
  creator: {
    id: string;
    username: string;
    profilePicture: string;
    verified?: boolean;
  };
  title: string;
  description: string;
  snapshot: {
    frontCamera: string; // Front camera photo
    backCamera: string; // Back camera photo
  };
  stake: number; // Fixed stake amount
  expiry: string; // ISO date string
  location?: string;
  createdAt: string;
  status: 'active' | 'expired' | 'resolved';
  resolution?: 'yes' | 'no'; // Final result
  
  // Pool data
  pool: {
    yes: {
      amount: number;
      participants: number;
    };
    no: {
      amount: number;
      participants: number;
    };
  };
  
  // User's commitment (if any)
  userCommitment?: {
    choice: 'yes' | 'no';
    amount: number;
    locked: boolean;
    committedAt: string;
  };
  
  // Updates from creator
  updates: ChallengeUpdate[];
}

export interface ChallengeUpdate {
  id: string;
  challengeId: string;
  creatorId: string;
  content: string;
  image?: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  profilePicture: string;
  phone: string;
  verified?: boolean;
  createdAt: string;
}

export interface Commitment {
  id: string;
  challengeId: string;
  userId: string;
  choice: 'yes' | 'no';
  amount: number;
  locked: boolean;
  committedAt: string;
  expectedPayout: number;
}
