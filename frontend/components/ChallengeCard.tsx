import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { Challenge } from '../types/challenge';
import Icon from './Icon';

interface ChallengeCardProps {
  challenge: Challenge;
  onCommit: (challengeId: string, choice: 'yes' | 'no') => void;
  onViewUpdates: (challengeId: string) => void;
}

const { width } = Dimensions.get('window');

export default function ChallengeCard({ challenge, onCommit, onViewUpdates }: ChallengeCardProps) {
  const [showUpdates, setShowUpdates] = useState(false);

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

  const odds = getOdds(challenge.pool);
  const timeRemaining = formatTimeRemaining(challenge.expiry);
  const isCommitted = challenge.userCommitment?.locked;
  const userChoice = challenge.userCommitment?.choice;

  const handleCommit = (choice: 'yes' | 'no') => {
    if (isCommitted) {
      Alert.alert('Already Committed', 'You have already committed to this challenge and cannot change your choice.');
      return;
    }

    Alert.alert(
      'Commit to Challenge',
      `Are you sure you want to commit $${challenge.stake} to "${choice.toUpperCase()}"? This choice cannot be changed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Commit', 
          style: 'default',
          onPress: () => onCommit(challenge.id, choice)
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={{ uri: challenge.creator.profilePicture }} style={styles.profilePicture} />
          <View style={styles.userDetails}>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>{challenge.creator.username}</Text>
              {challenge.creator.verified && <Icon name="check" size={14} color="#4f46e5" />}
            </View>
            <Text style={styles.location}>
              {challenge.location} • {timeRemaining}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Icon name="menu" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Challenge Title */}
      <Text style={styles.challengeTitle}>{challenge.title}</Text>

      {/* Dual Photo Layout (BeReal Style) */}
      <View style={styles.photoContainer}>
        {/* Back Camera Photo (Main) */}
        <Image source={{ uri: challenge.snapshot.backCamera }} style={styles.mainPhoto} />
        
        {/* Front Camera Photo (Overlay) */}
        <View style={styles.frontPhotoContainer}>
          <Image source={{ uri: challenge.snapshot.frontCamera }} style={styles.frontPhoto} />
        </View>
      </View>

      {/* Pool Stats */}
      <View style={styles.poolStats}>
        <View style={styles.poolRow}>
          <Text style={styles.poolLabel}>Yes Pool:</Text>
          <Text style={styles.poolAmount}>${challenge.pool.yes.amount}</Text>
          <Text style={styles.poolParticipants}>({challenge.pool.yes.participants})</Text>
        </View>
        <View style={styles.poolRow}>
          <Text style={styles.poolLabel}>No Pool:</Text>
          <Text style={styles.poolAmount}>${challenge.pool.no.amount}</Text>
          <Text style={styles.poolParticipants}>({challenge.pool.no.participants})</Text>
        </View>
        <View style={styles.oddsContainer}>
          <Text style={styles.oddsText}>Odds: {odds.yes}% Yes / {odds.no}% No</Text>
        </View>
      </View>

      {/* Updates Section */}
      {challenge.updates.length > 0 && (
        <View style={styles.updatesSection}>
          <TouchableOpacity 
            style={styles.updatesHeader}
            onPress={() => setShowUpdates(!showUpdates)}
          >
            <Text style={styles.updatesTitle}>
              Updates ({challenge.updates.length})
            </Text>
            <Text style={styles.updatesToggle}>
              {showUpdates ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
          
          {showUpdates && (
            <View style={styles.updatesList}>
              {challenge.updates.map((update) => (
                <View key={update.id} style={styles.updateItem}>
                  <Text style={styles.updateContent}>{update.content}</Text>
                  {update.image && (
                    <Image source={{ uri: update.image }} style={styles.updateImage} />
                  )}
                  <Text style={styles.updateTime}>
                    {new Date(update.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[
            styles.commitButton,
            styles.yesButton,
            isCommitted && userChoice === 'yes' && styles.committedButton,
            isCommitted && userChoice !== 'yes' && styles.disabledButton
          ]}
          onPress={() => handleCommit('yes')}
          disabled={isCommitted}
        >
          <Text style={[
            styles.commitButtonText,
            isCommitted && userChoice === 'yes' && styles.committedButtonText,
            isCommitted && userChoice !== 'yes' && styles.disabledButtonText
          ]}>
            {isCommitted && userChoice === 'yes' ? '✓ YES' : 'YES'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.commitButton,
            styles.noButton,
            isCommitted && userChoice === 'no' && styles.committedButton,
            isCommitted && userChoice !== 'no' && styles.disabledButton
          ]}
          onPress={() => handleCommit('no')}
          disabled={isCommitted}
        >
          <Text style={[
            styles.commitButtonText,
            isCommitted && userChoice === 'no' && styles.committedButtonText,
            isCommitted && userChoice !== 'no' && styles.disabledButtonText
          ]}>
            {isCommitted && userChoice === 'no' ? '✓ NO' : 'NO'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stake Info */}
      <View style={styles.stakeInfo}>
        <Text style={styles.stakeText}>Stake: ${challenge.stake} • {isCommitted ? 'Committed' : 'Not committed'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  verified: {
    color: '#4f46e5',
    fontSize: 14,
    marginLeft: 4,
  },
  location: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
  },
  menuDots: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  challengeTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  mainPhoto: {
    width: width - 32,
    height: (width - 32) * 1.2,
    alignSelf: 'center',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  frontPhotoContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 80,
    height: 100,
  },
  frontPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  poolStats: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  poolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  poolLabel: {
    color: '#9ca3af',
    fontSize: 14,
    width: 80,
  },
  poolAmount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  poolParticipants: {
    color: '#6b7280',
    fontSize: 12,
  },
  oddsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  oddsText: {
    color: '#4f46e5',
    fontSize: 12,
    fontWeight: '600',
  },
  updatesSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  updatesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  updatesTitle: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
  updatesToggle: {
    color: '#4f46e5',
    fontSize: 12,
  },
  updatesList: {
    marginTop: 8,
  },
  updateItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#1f2937',
    borderRadius: 8,
  },
  updateContent: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  updateImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  updateTime: {
    color: '#9ca3af',
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  commitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  yesButton: {
    backgroundColor: '#10b981',
  },
  noButton: {
    backgroundColor: '#ef4444',
  },
  committedButton: {
    backgroundColor: '#4f46e5',
  },
  disabledButton: {
    backgroundColor: '#374151',
  },
  commitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  committedButtonText: {
    color: '#fff',
  },
  disabledButtonText: {
    color: '#6b7280',
  },
  stakeInfo: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
  stakeText: {
    color: '#9ca3af',
    fontSize: 12,
  },
});
