import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Challenge } from '../types/challenge';
import { mockChallenges } from '../services/mockData';

type Props = NativeStackScreenProps<RootStackParamList, 'Commitments'>;

export default function CommitmentsScreen({ navigation }: Props) {
  // Filter challenges where user has committed
  const committedChallenges = mockChallenges.filter(challenge => 
    challenge.userCommitment?.locked
  );

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

  const getOdds = (pool: Challenge['pool']) => {
    const total = pool.yes.amount + pool.no.amount;
    if (total === 0) return { yes: 50, no: 50 };
    
    return {
      yes: Math.round((pool.yes.amount / total) * 100),
      no: Math.round((pool.no.amount / total) * 100)
    };
  };

  const renderCommitmentCard = ({ item: challenge }: { item: Challenge }) => {
    const odds = getOdds(challenge.pool);
    const timeRemaining = formatTimeRemaining(challenge.expiry);
    const userChoice = challenge.userCommitment?.choice;
    const expectedPayout = challenge.userCommitment?.expectedPayout || 0;

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorName}>{challenge.creator.username}</Text>
            <Text style={styles.challengeTitle}>{challenge.title}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={[
              styles.statusText,
              userChoice === 'yes' ? styles.yesStatus : styles.noStatus
            ]}>
              {userChoice?.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Pool Stats */}
        <View style={styles.poolStats}>
          <View style={styles.poolRow}>
            <Text style={styles.poolLabel}>Your Stake:</Text>
            <Text style={styles.poolAmount}>${challenge.stake}</Text>
          </View>
          <View style={styles.poolRow}>
            <Text style={styles.poolLabel}>Expected Payout:</Text>
            <Text style={styles.expectedPayout}>${expectedPayout.toFixed(2)}</Text>
          </View>
          <View style={styles.poolRow}>
            <Text style={styles.poolLabel}>Current Odds:</Text>
            <Text style={styles.oddsText}>
              {odds.yes}% Yes / {odds.no}% No
            </Text>
          </View>
        </View>

        {/* Pool Breakdown */}
        <View style={styles.poolBreakdown}>
          <View style={styles.poolSection}>
            <Text style={styles.poolSectionTitle}>Yes Pool</Text>
            <Text style={styles.poolSectionAmount}>${challenge.pool.yes.amount}</Text>
            <Text style={styles.poolSectionParticipants}>
              {challenge.pool.yes.participants} participants
            </Text>
          </View>
          <View style={styles.poolSection}>
            <Text style={styles.poolSectionTitle}>No Pool</Text>
            <Text style={styles.poolSectionAmount}>${challenge.pool.no.amount}</Text>
            <Text style={styles.poolSectionParticipants}>
              {challenge.pool.no.participants} participants
            </Text>
          </View>
        </View>

        {/* Time Remaining */}
        <View style={styles.timeContainer}>
          <Text style={styles.timeLabel}>Time Remaining:</Text>
          <Text style={[
            styles.timeText,
            timeRemaining === 'Expired' && styles.expiredText
          ]}>
            {timeRemaining}
          </Text>
        </View>

        {/* Locked Notice */}
        <View style={styles.lockedNotice}>
          <Text style={styles.lockedIcon}>🔒</Text>
          <Text style={styles.lockedText}>
            Your choice is locked and cannot be changed
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Commitments</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      {committedChallenges.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No Commitments Yet</Text>
          <Text style={styles.emptyDescription}>
            You haven't committed to any challenges yet.{'\n'}
            Go to the home feed to start betting!
          </Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.exploreButtonText}>Explore Challenges</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={committedChallenges}
          keyExtractor={(item) => item.id}
          renderItem={renderCommitmentCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: {
    width: 36,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 4,
  },
  challengeTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  yesStatus: {
    backgroundColor: '#10b981',
  },
  noStatus: {
    backgroundColor: '#ef4444',
  },
  poolStats: {
    marginBottom: 16,
  },
  poolRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  poolLabel: {
    color: '#9ca3af',
    fontSize: 14,
  },
  poolAmount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  expectedPayout: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  oddsText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
  poolBreakdown: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  poolSection: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#111827',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  poolSectionTitle: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
  },
  poolSectionAmount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  poolSectionParticipants: {
    color: '#6b7280',
    fontSize: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeLabel: {
    color: '#9ca3af',
    fontSize: 14,
  },
  timeText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
  expiredText: {
    color: '#ef4444',
  },
  lockedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
  },
  lockedIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  lockedText: {
    color: '#9ca3af',
    fontSize: 12,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDescription: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
