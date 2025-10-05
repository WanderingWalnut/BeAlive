import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Bet {
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

interface BetsContextType {
  bets: Bet[];
  addBet: (bet: Bet) => void;
  hasBet: (postId: string) => boolean;
  getBet: (postId: string) => Bet | undefined;
}

const BetsContext = createContext<BetsContextType | undefined>(undefined);

export const BetsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bets, setBets] = useState<Bet[]>([]);

  const addBet = (bet: Bet) => {
    setBets(prev => {
      // Check if bet already exists for this post
      const exists = prev.some(b => b.postId === bet.postId);
      if (exists) {
        return prev;
      }
      return [...prev, bet];
    });
  };

  const hasBet = (postId: string): boolean => {
    return bets.some(bet => bet.postId === postId);
  };

  const getBet = (postId: string): Bet | undefined => {
    return bets.find(bet => bet.postId === postId);
  };

  return (
    <BetsContext.Provider value={{ bets, addBet, hasBet, getBet }}>
      {children}
    </BetsContext.Provider>
  );
};

export const useBets = () => {
  const context = useContext(BetsContext);
  if (context === undefined) {
    throw new Error('useBets must be used within a BetsProvider');
  }
  return context;
};

