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
import { IconButton } from 'react-native-paper';

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
  const [routes] = useState([
    { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'commitments', title: 'Bets', focusedIcon: 'chart-line', unfocusedIcon: 'chart-line' },
    { key: 'create', title: 'Create', focusedIcon: 'plus', unfocusedIcon: 'plus' },
    { key: 'settings', title: 'Settings', focusedIcon: 'cog', unfocusedIcon: 'cog-outline' },
  ]);

  // Mock data for committed challenges
  const commitments: Commitment[] = [
    {
      id: '1',
      challengeTitle: 'Will I go to the gym 5 days this week?',
      creator: {
        username: 'Alex Chen',
        handle: '@alexchen',
        avatar: 'https://i.pravatar.cc/150?u=alexchen',
      },
      expiry: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      userChoice: 'yes',
      stake: 10,
      poolYes: 45,
      poolNo: 25,
      participantsYes: 3,
      participantsNo: 2,
      expectedPayout: 15,
      isExpired: false,
      updates: [
        {
          id: '1',
          content: 'Day 1: Hit the gym for 45 minutes',
          image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=200&fit=crop',
          timestamp: '2h ago',
        },
        {
          id: '2',
          content: 'Day 2: Another solid workout session',
          timestamp: '1d ago',
        },
      ],
    },
    {
      id: '2',
      challengeTitle: 'Will I complete my coding bootcamp project by Friday?',
      creator: {
        username: 'Sarah Kim',
        handle: '@sarahk',
        avatar: 'https://i.pravatar.cc/150?u=sarahk',
      },
      expiry: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      userChoice: 'no',
      stake: 15,
      poolYes: 60,
      poolNo: 30,
      participantsYes: 4,
      participantsNo: 2,
      expectedPayout: 22.5,
      isExpired: false,
      updates: [
        {
          id: '1',
          content: 'Making good progress on the frontend',
          timestamp: '4h ago',
        },
      ],
    },
    {
      id: '3',
      challengeTitle: 'Will I read 50 pages of my book this week?',
      creator: {
        username: 'Emma Davis',
        handle: '@emmad',
        avatar: 'https://i.pravatar.cc/150?u=emmad',
      },
      expiry: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Expired
      userChoice: 'yes',
      stake: 12,
      poolYes: 48,
      poolNo: 24,
      participantsYes: 4,
      participantsNo: 2,
      expectedPayout: 18,
      isExpired: true,
      outcome: 'yes',
      updates: [
        {
          id: '1',
          content: 'Finished the book! 67 pages read',
          timestamp: '2d ago',
        },
      ],
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

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  const handleTabPress = (key: string) => {
    if (key === 'home') {
      navigation.navigate('Home');
    } else if (key === 'create') {
      navigation.navigate('ChallengeCreation');
    } else if (key === 'settings') {
      navigation.navigate('Profile');
    }
  };

  const renderCommitmentCard = ({ item }: { item: Commitment }) => {
    const isExpanded = expandedCards.has(item.id);
    const timeRemaining = formatTimeRemaining(item.expiry);
    const totalPool = item.poolYes + item.poolNo;
    const userPool = item.userChoice === 'yes' ? item.poolYes : item.poolNo;
    const userParticipants = item.userChoice === 'yes' ? item.participantsYes : item.participantsNo;
    const userPercent = totalPool > 0 ? Math.round((userPool / totalPool) * 100) : 50;

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.creatorInfo}>
            <Image source={{ uri: item.creator.avatar }} style={styles.creatorAvatar} />
            <View style={styles.creatorDetails}>
              <Text style={styles.creatorName}>{item.creator.username}</Text>
              <Text style={styles.creatorHandle}>{item.creator.handle}</Text>
            </View>
          </View>
          <View style={styles.timeInfo}>
            <Text style={[
              styles.timeRemaining,
              item.isExpired ? styles.expiredText : styles.activeText
            ]}>
              {timeRemaining}
            </Text>
          </View>
        </View>

        {/* Challenge Title */}
        <Text style={styles.challengeTitle}>{item.challengeTitle}</Text>

        {/* User's Choice */}
        <View style={styles.userChoice}>
          <View style={[
            styles.choiceBadge,
            item.userChoice === 'yes' ? styles.yesBadge : styles.noBadge
          ]}>
            <Text style={styles.choiceText}>
              You committed to {item.userChoice.toUpperCase()}
            </Text>
            <Text style={styles.stakeText}>${item.stake} stake</Text>
          </View>
        </View>

        {/* Pool Stats */}
        <View style={styles.poolStats}>
          <View style={styles.poolRow}>
            <Text style={styles.poolLabel}>Your side ({item.userChoice.toUpperCase()}):</Text>
            <Text style={styles.poolAmount}>${userPool}</Text>
            <Text style={styles.poolPercent}>({userPercent}%)</Text>
          </View>
          <View style={styles.poolRow}>
            <Text style={styles.poolLabel}>Total pool:</Text>
            <Text style={styles.poolAmount}>${totalPool}</Text>
            <Text style={styles.poolParticipants}>{userParticipants} participants</Text>
          </View>
          {!item.isExpired && (
            <Text style={styles.expectedPayout}>
              Expected payout if you win: ${item.expectedPayout}
            </Text>
          )}
        </View>

        {/* Outcome (if expired) */}
        {item.isExpired && item.outcome && (
          <View style={styles.outcomeSection}>
            <Text style={styles.outcomeTitle}>Challenge Result</Text>
            <Text style={[
              styles.outcomeText,
              item.outcome === item.userChoice ? styles.winnerText : styles.loserText
            ]}>
              {item.outcome === item.userChoice ? 'You won!' : 'You lost'}
            </Text>
            <Text style={styles.payoutText}>
              {item.outcome === item.userChoice 
                ? `Payout: $${item.expectedPayout}` 
                : 'No payout'
              }
            </Text>
          </View>
        )}

        {/* Expandable Updates Section */}
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => toggleExpanded(item.id)}
        >
          <Text style={styles.expandText}>
            Updates & Participants ({item.updates.length})
          </Text>
          <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Updates */}
            <View style={styles.updatesSection}>
              <Text style={styles.sectionTitle}>Progress Updates</Text>
              {item.updates.map((update) => (
                <View key={update.id} style={styles.updateItem}>
                  <Text style={styles.updateContent}>{update.content}</Text>
                  {update.image && (
                    <Image source={{ uri: update.image }} style={styles.updateImage} />
                  )}
                  <Text style={styles.updateTimestamp}>{update.timestamp}</Text>
                </View>
              ))}
            </View>

            {/* Participants */}
            <View style={styles.participantsSection}>
              <Text style={styles.sectionTitle}>Participants</Text>
              <View style={styles.participantsStats}>
                <View style={styles.participantRow}>
                  <Text style={styles.participantLabel}>YES:</Text>
                  <Text style={styles.participantCount}>{item.participantsYes} people</Text>
                  <Text style={styles.participantAmount}>${item.poolYes}</Text>
                </View>
                <View style={styles.participantRow}>
                  <Text style={styles.participantLabel}>NO:</Text>
                  <Text style={styles.participantCount}>{item.participantsNo} people</Text>
                  <Text style={styles.participantAmount}>${item.poolNo}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Commitments</Text>
      </View>

      {/* Commitments List */}
      <FlatList
        data={commitments}
        keyExtractor={(item) => item.id}
        renderItem={renderCommitmentCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, index === 0 && styles.activeNavItem]}
          onPress={() => handleTabPress('home')}
        >
          <IconButton
            icon={index === 0 ? 'home' : 'home-outline'}
            size={24}
            iconColor={index === 0 ? '#4f46e5' : '#9ca3af'}
            style={styles.navIcon}
          />
          <Text style={[styles.navText, index === 0 && styles.activeNavText]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, index === 1 && styles.activeNavItem]}
          onPress={() => handleTabPress('commitments')}
        >
          <IconButton
            icon={index === 1 ? 'chart-line' : 'chart-line'}
            size={24}
            iconColor={index === 1 ? '#4f46e5' : '#9ca3af'}
            style={styles.navIcon}
          />
          <Text style={[styles.navText, index === 1 && styles.activeNavText]}>Bets</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, index === 2 && styles.activeNavItem]}
          onPress={() => handleTabPress('create')}
        >
          <IconButton
            icon={index === 2 ? 'plus' : 'plus'}
            size={24}
            iconColor={index === 2 ? '#4f46e5' : '#9ca3af'}
            style={styles.navIcon}
          />
          <Text style={[styles.navText, index === 2 && styles.activeNavText]}>Create</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, index === 3 && styles.activeNavItem]}
          onPress={() => handleTabPress('settings')}
        >
          <IconButton
            icon={index === 3 ? 'cog' : 'cog-outline'}
            size={24}
            iconColor={index === 3 ? '#4f46e5' : '#9ca3af'}
            style={styles.navIcon}
          />
          <Text style={[styles.navText, index === 3 && styles.activeNavText]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  creatorHandle: {
    color: '#9ca3af',
    fontSize: 12,
  },
  timeInfo: {
    alignItems: 'flex-end',
  },
  timeRemaining: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: '#4f46e5',
  },
  expiredText: {
    color: '#ef4444',
  },
  challengeTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 22,
  },
  userChoice: {
    marginBottom: 12,
  },
  choiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  yesBadge: {
    backgroundColor: '#10b981',
  },
  noBadge: {
    backgroundColor: '#ef4444',
  },
  choiceText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  stakeText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  poolStats: {
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  poolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  poolLabel: {
    color: '#9ca3af',
    fontSize: 12,
    flex: 1,
  },
  poolAmount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  poolPercent: {
    color: '#4f46e5',
    fontSize: 10,
    marginRight: 8,
  },
  poolParticipants: {
    color: '#6b7280',
    fontSize: 10,
  },
  expectedPayout: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  outcomeSection: {
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  outcomeTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  outcomeText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  winnerText: {
    color: '#10b981',
  },
  loserText: {
    color: '#ef4444',
  },
  payoutText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  expandButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  expandText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
  expandIcon: {
    color: '#4f46e5',
    fontSize: 12,
  },
  expandedContent: {
    marginTop: 12,
  },
  updatesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  updateItem: {
    backgroundColor: '#1f2937',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  updateContent: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 4,
  },
  updateImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginBottom: 4,
  },
  updateTimestamp: {
    color: '#6b7280',
    fontSize: 10,
  },
  participantsSection: {
    marginBottom: 8,
  },
  participantsStats: {
    backgroundColor: '#1f2937',
    padding: 8,
    borderRadius: 6,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantLabel: {
    color: '#9ca3af',
    fontSize: 12,
    width: 30,
  },
  participantCount: {
    color: '#fff',
    fontSize: 12,
    flex: 1,
  },
  participantAmount: {
    color: '#4f46e5',
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