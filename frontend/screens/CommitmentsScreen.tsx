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
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import BottomNavigation from '../components/BottomNavigation';
import { useCommitments } from '../contexts/CommitmentsContext';
import { IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

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
  image?: string;
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
  const [index, setIndex] = useState(1);
  const { commitments } = useCommitments();

  const handleTabPress = (key: string) => {
    if (key === 'home') {
  navigation.replace('Home', {} as any);
    } else if (key === 'settings') {
      navigation.replace('Profile');
    }
  };

  const formatTimeRemaining = (expiry: string) => {
    const now = new Date();
    const expiryDate = new Date(expiry);
    const diffMs = expiryDate.getTime() - now.getTime();

    if (diffMs <= 0) return { text: 'Expired', color: '#ef4444' };

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 7) return { text: `${days} days left`, color: '#10b981' };
    if (days > 0) return { text: `${days}d ${hours}h left`, color: '#f59e0b' };
    return { text: `${hours}h left`, color: '#ef4444' };
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

  const calculateStats = (item: Commitment) => {
    const totalPool = item.poolYes + item.poolNo;
    const userSidePool = item.userChoice === 'yes' ? item.poolYes : item.poolNo;
    const otherSidePool = item.userChoice === 'yes' ? item.poolNo : item.poolYes;
    const userSidePercent = totalPool > 0 ? Math.round((userSidePool / totalPool) * 100) : 50;
    const potentialReturn = item.expectedPayout - item.stake;
    const roi = item.stake > 0 ? Math.round((potentialReturn / item.stake) * 100) : 0;
    
    return { totalPool, userSidePool, otherSidePool, userSidePercent, potentialReturn, roi };
  };

  const renderSummaryCard = () => {
    if (commitments.length === 0) return null;

    const totalCommitted = commitments.reduce((sum, commitment) => sum + commitment.stake, 0);
    const totalPotentialReturn = commitments.reduce((sum, commitment) => sum + commitment.expectedPayout, 0);
    const activeCommitments = commitments.filter(commitment => !commitment.isExpired).length;

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Your Impact</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>${totalCommitted}</Text>
            <Text style={styles.summaryStatLabel}>Total Committed</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStatItem}>
            <Text style={[styles.summaryStatValue, { color: '#10b981' }]}> 
              {activeCommitments}
            </Text>
            <Text style={styles.summaryStatLabel}>Active Commits</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>
              {commitments.filter(c => c.userChoice === 'yes').length}
            </Text>
            <Text style={styles.summaryStatLabel}>Believing In</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCommitmentCard = ({ item }: { item: Commitment }) => {
    const isExpanded = expandedCards.has(item.id);
    const timeInfo = formatTimeRemaining(item.expiry);
    const stats = calculateStats(item);
    const hasExpired = timeInfo.text === 'Expired';
    const userWon = hasExpired && item.outcome === item.userChoice;

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.95}
        onPress={() => toggleExpand(item.id)}
      >
        {/* Challenge Image (if available) */}
        {item.image && (
          <View style={styles.cardImageContainer}>
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.imageOverlay} />
          </View>
        )}

        {/* Main Content */}
        <View style={styles.cardContent}>
          {/* Header with creator info */}
          <View style={styles.cardHeader}>
            <Image 
              source={{ uri: item.creator.avatar }} 
              style={styles.creatorAvatar}
            />
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorName}>{item.creator.username}</Text>
              <Text style={styles.creatorHandle}>{item.creator.handle}</Text>
            </View>
            <View style={[styles.timeBadge, { backgroundColor: `${timeInfo.color}20` }]}>
              <Text style={[styles.timeText, { color: timeInfo.color }]}>
                {timeInfo.text}
              </Text>
            </View>
          </View>

          {/* Challenge Title */}
          <Text style={styles.challengeTitle} numberOfLines={2}>
            {item.challengeTitle}
          </Text>

          {/* Your Commitment */}
          <View style={styles.positionContainer}>
            <View style={styles.positionBadge}>
              <Text style={styles.positionLabel}>YOUR COMMITMENT</Text>
              <View style={[
                styles.positionValue,
                item.userChoice === 'yes' ? styles.yesPosition : styles.noPosition
              ]}>
                <Text style={styles.positionText}>
                  {item.userChoice === 'yes' ? '✓ Supporting' : '✗ Doubtful'}
                </Text>
                <Text style={styles.positionAmount}>${item.stake}</Text>
              </View>
            </View>

            {!hasExpired && (
              <View style={styles.returnsContainer}>
                <Text style={styles.returnsLabel}>If Correct</Text>
                <Text style={styles.returnsValue}>
                  ${item.expectedPayout.toFixed(2)}
                </Text>
                <Text style={[
                  styles.roiText,
                  stats.roi > 0 ? styles.roiPositive : styles.roiNeutral
                ]}>
                  {stats.potentialReturn > 0 ? '+$' : ''}{stats.potentialReturn.toFixed(0)} back
                </Text>
              </View>
            )}
          </View>

          {/* Community Support Distribution */}
          {!hasExpired && (
            <View style={styles.poolDistribution}>
              <Text style={styles.communityLabel}>Community Support</Text>
              <View style={styles.poolBar}>
                <View 
                  style={[
                    styles.poolBarYes, 
                    { width: `${stats.userSidePercent}%` }
                  ]} 
                />
              </View>
              <View style={styles.poolLabels}>
                <View style={styles.poolLabelItem}>
                  <View style={[styles.poolDot, { backgroundColor: '#10b981' }]} />
                  <Text style={styles.poolLabelText}>
                    Believing: ${stats.userSidePool} ({stats.userSidePercent}%)
                  </Text>
                </View>
                <View style={styles.poolLabelItem}>
                  <View style={[styles.poolDot, { backgroundColor: '#ef4444' }]} />
                  <Text style={styles.poolLabelText}>
                    Skeptical: ${stats.otherSidePool} ({100 - stats.userSidePercent}%)
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Outcome (if expired) */}
          {hasExpired && (
            <View style={[
              styles.outcomeContainer,
              userWon ? styles.outcomeWin : styles.outcomeLoss
            ]}>
              <View style={styles.outcomeContent}>
                <IconButton 
                  icon={userWon ? 'check-circle' : 'close-circle'}
                  size={24}
                  iconColor={userWon ? '#10b981' : '#ef4444'}
                  style={styles.outcomeIcon}
                />
                <View style={styles.outcomeTextContainer}>
                  <Text style={[
                    styles.outcomeText,
                    { color: userWon ? '#10b981' : '#ef4444' }
                  ]}>
                    {userWon ? 'You Were Right!' : 'Challenge Completed'}
                  </Text>
                  {userWon && (
                    <Text style={styles.outcomeAmount}>
                      Received ${item.expectedPayout.toFixed(2)}
                    </Text>
                  )}
                  {!userWon && (
                    <Text style={styles.outcomeSubtext}>
                      Your support made a difference
                    </Text>
                  )}
                    {/* Distribution breakdown */}
                    {hasExpired && (
                      <View style={styles.distributionContainer}>
                        <Text style={styles.distributionTitle}>Distribution</Text>
                        <Text style={styles.distributionText}>Total pool: ${ (item.poolYes + item.poolNo).toFixed(2) }</Text>
                        <Text style={styles.distributionText}>Believing: ${ item.poolYes } • Skeptical: ${ item.poolNo }</Text>
                        {item.outcome && (
                          <Text style={styles.distributionText}>Winners ({item.outcome}): share distributed accordingly</Text>
                        )}
                      </View>
                    )}
                </View>
              </View>
            </View>
          )}

          {/* Expand Button */}
          <TouchableOpacity 
            style={styles.expandToggle}
            onPress={() => toggleExpand(item.id)}
          >
            <Text style={styles.expandText}>
              {isExpanded ? 'Show Less' : 'View Details'}
            </Text>
            <IconButton
              icon={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              iconColor="#6B8AFF"
              style={styles.expandIcon}
            />
          </TouchableOpacity>

          {/* Expanded Content */}
          {isExpanded && (
            <View style={styles.expandedSection}>
              {/* Challenge Stats */}
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>${stats.totalPool}</Text>
                  <Text style={styles.statLabel}>Total Committed</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {item.participantsYes + item.participantsNo}
                  </Text>
                  <Text style={styles.statLabel}>Friends Supporting</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{item.participantsYes}</Text>
                  <Text style={styles.statLabel}>Believing</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{item.participantsNo}</Text>
                  <Text style={styles.statLabel}>Skeptical</Text>
                </View>
              </View>

              {/* Updates Section */}
              {item.updates && item.updates.length > 0 && (
                <View style={styles.updatesSection}>
                  <Text style={styles.sectionTitle}>Progress Updates</Text>
                  {item.updates.map((update, idx) => (
                    <View key={update.id} style={styles.updateCard}>
                      <View style={styles.updateHeader}>
                        <View style={styles.updateDot} />
                        <Text style={styles.updateTime}>
                          {new Date(update.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </Text>
                      </View>
                      <Text style={styles.updateText}>{update.content}</Text>
                      {update.image && (
                        <Image 
                          source={{ uri: update.image }} 
                          style={styles.updateImage} 
                        />
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <IconButton 
          icon="account-heart" 
          size={64} 
          iconColor="#E0E5ED"
          style={styles.emptyIcon}
        />
      </View>
      <Text style={styles.emptyTitle}>No Active Commitments</Text>
      <Text style={styles.emptyText}>
        Commit to friends' goals and help them stay accountable
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton}
  onPress={() => navigation.replace('Home', {} as any)}
      >
  <Text style={styles.emptyButtonText}>Find Friends</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />
      
      {/* Compact header removed to match minimal settings style */}

      {commitments.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={commitments as any}
          keyExtractor={(item) => item.id}
          renderItem={renderCommitmentCard}
          ListHeaderComponent={renderSummaryCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

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
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E5ED',
  },
  headerTitle: {
    color: '#1A1D2E',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E5ED',
    shadowColor: '#6B8AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryTitle: {
    color: '#1A1D2E',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatValue: {
    color: '#1A1D2E',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryStatLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E5ED',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E5ED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  creatorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    color: '#1A1D2E',
    fontSize: 14,
    fontWeight: '600',
  },
  distributionContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  distributionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1D2E',
    marginBottom: 6,
  },
  distributionText: {
    fontSize: 13,
    color: '#4B5563',
  },
  creatorHandle: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  timeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  challengeTitle: {
    color: '#1A1D2E',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 16,
  },
  positionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  positionBadge: {
    flex: 1,
    marginRight: 12,
  },
  positionLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  positionValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  yesPosition: {
    backgroundColor: '#10b98120',
  },
  noPosition: {
    backgroundColor: '#ef444420',
  },
  positionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1D2E',
  },
  positionAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1D2E',
  },
  returnsContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  returnsLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  returnsValue: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  roiText: {
    fontSize: 11,
    fontWeight: '600',
  },
  roiPositive: {
    color: '#10b981',
  },
  roiNeutral: {
    color: '#9CA3AF',
  },
  poolDistribution: {
    marginBottom: 16,
  },
  communityLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  poolBar: {
    height: 6,
    backgroundColor: '#ef444420',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  poolBarYes: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  poolLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  poolLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poolDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  poolLabelText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
  },
  outcomeContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  outcomeWin: {
    backgroundColor: '#10b98115',
    borderWidth: 1,
    borderColor: '#10b98140',
  },
  outcomeLoss: {
    backgroundColor: '#ef444415',
    borderWidth: 1,
    borderColor: '#ef444440',
  },
  outcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  outcomeIcon: {
    margin: 0,
  },
  outcomeTextContainer: {
    flex: 1,
  },
  outcomeText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  outcomeAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  outcomeSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E5ED',
  },
  expandText: {
    color: '#6B8AFF',
    fontSize: 13,
    fontWeight: '600',
  },
  expandIcon: {
    margin: 0,
  },
  expandedSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E5ED',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFB',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  statValue: {
    color: '#1A1D2E',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    textAlign: 'center',
  },
  updatesSection: {
    marginTop: 8,
  },
  sectionTitle: {
    color: '#1A1D2E',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  updateCard: {
    backgroundColor: '#F8FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  updateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6B8AFF',
    marginRight: 8,
  },
  updateTime: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  updateText: {
    color: '#1A1D2E',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  updateImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    margin: 0,
  },
  emptyTitle: {
    color: '#1A1D2E',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#6B8AFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
