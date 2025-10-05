import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import BottomNavigation from '../components/BottomNavigation';
import { useBets } from '../contexts/BetsContext';
import FloatingButton from '../components/FloatingButton';

interface Commitment {
  id: string;
  challengeTitle: string;
  creator: {
    username: string;
    handle: string;
    avatar: string;
  };
  expiry: string;
  userChoice: 'yes' | 'no';
  stake: number;
  poolYes: number;
  poolNo: number;
  participantsYes: number;
  participantsNo: number;
  expectedPayout: number;
  updates: Array<{
    id: string;
    content: string;
    image?: string;
    timestamp: string;
  }>;
  isExpired: boolean;
  outcome?: 'yes' | 'no';
}

type Props = NativeStackScreenProps<RootStackParamList, 'Commitments'>;

export default function CommitmentsScreen({ navigation }: Props) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(1); // Start with commitments tab active
  const { bets } = useBets();

  const handleTabPress = (key: string) => {
    if (key === 'home') {
      navigation.replace('Home');
    } else if (key === 'settings') {
      navigation.replace('Profile');
    }
  };

  // Use bets from context, or show mock data if no bets yet
  const commitments: Commitment[] = bets.length > 0 ? bets : [
    {
      id: '1',
      challengeTitle: 'Will I go to the gym 5 days this week?',
      creator: { 
        username: 'Alex Chen', 
        handle: '@alexchen',
        avatar: 'https://i.pravatar.cc/150?u=alexchen' 
      },
      expiry: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      userChoice: 'yes',
      stake: 10,
      poolYes: 45,
      poolNo: 25,
      participantsYes: 3,
      participantsNo: 2,
      expectedPayout: 15,
      updates: [
        { 
          id: 'u1', 
          content: 'Day 1: Hit the gym!', 
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() 
        },
        { 
          id: 'u2', 
          content: 'Day 2: Feeling good!', 
          image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=150&fit=crop',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() 
        },
      ],
      isExpired: false,
    },
    {
      id: '2',
      challengeTitle: 'Will I complete my coding bootcamp project by Friday?',
      creator: { 
        username: 'Sarah Kim', 
        handle: '@sarahk',
        avatar: 'https://i.pravatar.cc/150?u=sarahk' 
      },
      expiry: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      userChoice: 'no',
      stake: 15,
      poolYes: 60,
      poolNo: 30,
      participantsYes: 4,
      participantsNo: 2,
      expectedPayout: 15,
      updates: [
        { 
          id: 'u3', 
          content: 'Project started!', 
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() 
        },
      ],
      isExpired: false,
    },
    {
      id: '3',
      challengeTitle: 'Will I read 50 pages of my book this week?',
      creator: { 
        username: 'Emma Davis', 
        handle: '@emmad',
        avatar: 'https://i.pravatar.cc/150?u=emmad' 
      },
      expiry: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Expired
      userChoice: 'yes',
      stake: 12,
      poolYes: 48,
      poolNo: 24,
      participantsYes: 4,
      participantsNo: 2,
      expectedPayout: 18,
      updates: [
        { 
          id: 'u4', 
          content: 'Finished chapter 1!', 
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() 
        },
        { 
          id: 'u5', 
          content: 'Reached 50 pages!', 
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() 
        },
      ],
      isExpired: true,
      outcome: 'yes',
    },
  ];

  const formatTimeRemaining = (expiry: string) => {
    const now = new Date();
    const expiryDate = new Date(expiry);
    const diffMs = expiryDate.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expired';

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };


  const renderCommitmentCard = ({ item }: { item: Commitment }) => {
    const isExpanded = expandedCards.has(item.id);
    const timeRemaining = formatTimeRemaining(item.expiry);
    const totalPool = item.poolYes + item.poolNo;
    const userSidePool = item.userChoice === 'yes' ? item.poolYes : item.poolNo;
    const userSideParticipants = item.userChoice === 'yes' ? item.participantsYes : item.participantsNo;
    const otherSidePool = item.userChoice === 'yes' ? item.poolNo : item.poolYes;
    const otherSideParticipants = item.userChoice === 'yes' ? item.participantsNo : item.participantsYes;

    const userSidePercent = totalPool > 0 ? Math.round((userSidePool / totalPool) * 100) : 50;
    const otherSidePercent = totalPool > 0 ? Math.round((otherSidePool / totalPool) * 100) : 50;

    const expectedPayout = userSideParticipants > 0 ? (totalPool / userSideParticipants) : 0;
    const hasExpired = timeRemaining === 'Expired';
    const userWon = hasExpired && item.outcome === item.userChoice;

    return (
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.challengeTitle}>{item.challengeTitle}</Text>
            <Text style={styles.creatorText}>by {item.creator.username}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={[
              styles.timeRemaining,
              hasExpired ? styles.expiredTime : styles.activeTime
            ]}>
              {timeRemaining}
            </Text>
          </View>
        </View>

        {/* Your Investment */}
        <View style={styles.investmentSection}>
          <View style={styles.investmentRow}>
            <Text style={styles.investmentLabel}>Your Investment:</Text>
            <View style={[
              styles.choiceBadge,
              item.userChoice === 'yes' ? styles.yesBadge : styles.noBadge
            ]}>
              <Text style={styles.choiceText}>
                {item.userChoice === 'yes' ? 'YES' : 'NO'} (${item.stake})
              </Text>
            </View>
          </View>
        </View>

        {/* Pool Stats */}
        <View style={styles.poolStats}>
          <View style={styles.poolRow}>
            <Text style={styles.poolLabel}>Total Pool:</Text>
            <Text style={styles.poolValue}>${totalPool}</Text>
          </View>
          <View style={styles.poolRow}>
            <Text style={styles.poolLabel}>Your Side ({item.userChoice.toUpperCase()}):</Text>
            <Text style={styles.poolValue}>${userSidePool} ({userSidePercent}%)</Text>
          </View>
          <View style={styles.poolRow}>
            <Text style={styles.poolLabel}>Other Side:</Text>
            <Text style={styles.poolValue}>${otherSidePool} ({otherSidePercent}%)</Text>
          </View>
          {!hasExpired && (
            <View style={styles.payoutRow}>
              <Text style={styles.payoutLabel}>Expected Return:</Text>
              <Text style={styles.payoutValue}>${expectedPayout.toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* Outcome (if expired) */}
        {hasExpired && (
          <View style={[
            styles.outcomeSection,
            userWon ? styles.outcomeWin : styles.outcomeLoss
          ]}>
            <Text style={styles.outcomeText}>
              {userWon ? 'You Won!' : 'You Lost!'}
            </Text>
            {userWon && <Text style={styles.payoutReceived}>Received: ${expectedPayout.toFixed(2)}</Text>}
          </View>
        )}

        {/* Expandable Details */}
        <TouchableOpacity style={styles.expandButton} onPress={() => toggleExpand(item.id)}>
          <Text style={styles.expandButtonText}>
            {isExpanded ? 'Hide Details ▲' : 'Show Details ▼'}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Creator Updates */}
            {item.updates.length > 0 && (
              <View style={styles.updatesSection}>
                <Text style={styles.sectionHeader}>Progress Updates:</Text>
                {item.updates.map((update) => (
                  <View key={update.id} style={styles.updateItem}>
                    <Text style={styles.updateContent}>{update.content}</Text>
                    {update.image && (
                      <Image source={{ uri: update.image }} style={styles.updateImage} />
                    )}
                    <Text style={styles.updateTime}>
                      {new Date(update.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Participants Breakdown */}
            <View style={styles.participantsSection}>
              <Text style={styles.sectionHeader}>Investors:</Text>
              <View style={styles.participantRow}>
                <Text style={styles.participantCount}>YES: {item.participantsYes} people</Text>
                <Text style={styles.participantAmount}>${item.poolYes}</Text>
              </View>
              <View style={styles.participantRow}>
                <Text style={styles.participantCount}>NO: {item.participantsNo} people</Text>
                <Text style={styles.participantAmount}>${item.poolNo}</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Investments</Text>
        <Text style={styles.headerSubtitle}>Supporting friends' challenges</Text>
      </View>

      {/* Commitments List */}
      {bets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Bets Yet</Text>
          <Text style={styles.emptyText}>
            Start betting on challenges in the Home feed to see them here!
          </Text>
        </View>
      ) : (
        <FlatList
          data={commitments}
          keyExtractor={(item) => item.id}
          renderItem={renderCommitmentCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating + Button - Always Visible */}
      <FloatingButton />

      {/* Bottom Navigation */}
      <BottomNavigation 
        currentIndex={index}
        onTabPress={handleTabPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E5ED',
  },
  headerTitle: {
    color: '#1A1D2E',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  listContainer: {
    padding: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#1A1D2E',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E5ED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E5ED',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  challengeTitle: {
    color: '#1A1D2E',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 20,
  },
  creatorText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  timeRemaining: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeTime: {
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  expiredTime: {
    color: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  investmentSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E5ED',
    backgroundColor: '#F8FAFB',
  },
  investmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  investmentLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  choiceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  yesBadge: {
    backgroundColor: '#10b981',
  },
  noBadge: {
    backgroundColor: '#FF6B6B',
  },
  choiceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  poolStats: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E5ED',
  },
  poolRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  poolLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  poolValue: {
    color: '#1A1D2E',
    fontSize: 12,
    fontWeight: '500',
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E5ED',
  },
  payoutLabel: {
    color: '#6B8AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  payoutValue: {
    color: '#6B8AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  outcomeSection: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E5ED',
  },
  outcomeWin: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  outcomeLoss: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  outcomeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1D2E',
    marginBottom: 2,
  },
  payoutReceived: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  expandButton: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E0E5ED',
  },
  expandButtonText: {
    color: '#6B8AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  expandedContent: {
    padding: 16,
    backgroundColor: '#F8FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E0E5ED',
  },
  updatesSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    color: '#1A1D2E',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  updateItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E0E5ED',
  },
  updateContent: {
    color: '#1A1D2E',
    fontSize: 12,
    marginBottom: 6,
  },
  updateImage: {
    width: 80,
    height: 60,
    borderRadius: 6,
    resizeMode: 'cover',
    marginBottom: 6,
  },
  updateTime: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  participantsSection: {},
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  participantCount: {
    color: '#1A1D2E',
    fontSize: 12,
    flex: 1,
  },
  participantAmount: {
    color: '#6B8AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  activeNavItem: {
    backgroundColor: 'transparent',
  },
  navIcon: {
    margin: 0,
    width: 24,
    height: 24,
  },
  navText: {
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 2,
  },
  activeNavText: {
    color: '#4f46e5',
  },
});