import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Commitment {
  id: string;
  postId: string;
  challengeTitle: string;
  creator: {
    username: string;
    handle: string;
    avatar?: string;
  };
  userChoice: 'yes' | 'no';
  stake: number;
  poolYes: number;
  poolNo: number;
  participantsYes: number;
  participantsNo: number;
  expectedPayout: number;
  expiry: string;
  image?: string;
  isExpired: boolean;
  outcome?: 'yes' | 'no';
  updates: Array<{
    id: string;
    content: string;
    image?: string;
    timestamp: string;
  }>;
}

interface CommitmentsContextType {
  commitments: Commitment[];
  addCommitment: (commitment: Commitment) => void;
  hasCommitment: (postId: string) => boolean;
  getCommitment: (postId: string) => Commitment | undefined;
}

const CommitmentsContext = createContext<CommitmentsContextType | undefined>(undefined);

export const CommitmentsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [commitments, setCommitments] = useState<Commitment[]>([]);

  const addCommitment = (commitment: Commitment) => {
    setCommitments(prev => {
      // Check if commitment already exists for this post
      const exists = prev.some(c => c.postId === commitment.postId);
      if (exists) {
        return prev;
      }
      return [...prev, commitment];
    });
  };

  const hasCommitment = (postId: string): boolean => {
    return commitments.some(commitment => commitment.postId === postId);
  };

  const getCommitment = (postId: string): Commitment | undefined => {
    return commitments.find(commitment => commitment.postId === postId);
  };

  return (
    <CommitmentsContext.Provider value={{ commitments, addCommitment, hasCommitment, getCommitment }}>
      {children}
    </CommitmentsContext.Provider>
  );
};

export const useCommitments = () => {
  const context = useContext(CommitmentsContext);
  if (context === undefined) {
    throw new Error('useCommitments must be used within a CommitmentsProvider');
  }
  return context;
};

