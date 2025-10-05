import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { IconButton } from 'react-native-paper';

interface SocialPostProps {
  id: string;
  username: string;
  handle: string;
  timestamp: string;
  content: string;
  image?: string;
  verified?: boolean;
  upvotes: number;
  downvotes: number;
  onUpvote: () => void;
  onDownvote: () => void;
  // Betting properties
  stake?: number;
  poolYes?: number;
  poolNo?: number;
  participantsYes?: number;
  participantsNo?: number;
  expiry?: string;
  userCommitment?: {
    choice: 'yes' | 'no';
    locked: boolean;
  };
  onCommit?: (choice: 'yes' | 'no') => void;
}

export default function SocialPost({
  username,
  handle,
  timestamp,
  content,
  image,
  verified = false,
  upvotes,
  downvotes,
  onUpvote,
  onDownvote,
  stake,
  poolYes = 0,
  poolNo = 0,
  participantsYes = 0,
  participantsNo = 0,
  expiry,
  userCommitment,
  onCommit,
}: SocialPostProps) {
  // Format expiry date
  const formatExpiry = (expiryDate: string | undefined) => {
    if (!expiryDate) return '';
    
    const now = new Date();
    const expDate = new Date(expiryDate);
    const diffMs = expDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h left`;
    } else if (diffHours > 0) {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffHours}h ${diffMinutes}m left`;
    } else {
      return 'Ending soon';
    }
  };
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: `https://i.pravatar.cc/40?img=${Math.floor(Math.random() * 70)}` }}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.username}>{username}</Text>
              {verified && <Text style={styles.verified}>✓</Text>}
              <Text style={styles.handle}>{handle}</Text>
              <Text style={styles.timestamp}>• {timestamp}</Text>
            </View>
            {expiry && stake && (
              <View style={styles.expiryRow}>
                <Text style={styles.expiryText}>⏱ {formatExpiry(expiry)}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.contentText}>{content}</Text>
        {image && (
          <Image source={{ uri: image }} style={styles.contentImage} />
        )}
      </View>

      {/* Interaction Bar */}
      <View style={styles.interactions}>
        {stake && onCommit ? (
          // Betting mode - Yes/No buttons
          <>
            <TouchableOpacity 
              style={[
                styles.interactionItem,
                userCommitment?.choice === 'yes' && styles.selectedItem,
                userCommitment?.locked && styles.lockedItem
              ]} 
              onPress={() => !userCommitment?.locked && onCommit('yes')}
              disabled={userCommitment?.locked}
            >
              <IconButton
                icon="arrow-up"
                size={20}
                iconColor={userCommitment?.choice === 'yes' ? '#4f46e5' : '#9ca3af'}
                style={styles.interactionIcon}
              />
              <Text style={[
                styles.interactionText,
                userCommitment?.choice === 'yes' && styles.selectedText
              ]}>
                YES ({participantsYes})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.interactionItem,
                userCommitment?.choice === 'no' && styles.selectedItem,
                userCommitment?.locked && styles.lockedItem
              ]} 
              onPress={() => !userCommitment?.locked && onCommit('no')}
              disabled={userCommitment?.locked}
            >
              <IconButton
                icon="arrow-down"
                size={20}
                iconColor={userCommitment?.choice === 'no' ? '#4f46e5' : '#9ca3af'}
                style={styles.interactionIcon}
              />
              <Text style={[
                styles.interactionText,
                userCommitment?.choice === 'no' && styles.selectedText
              ]}>
                NO ({participantsNo})
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          // Regular social media mode - upvote/downvote
          <>
            <TouchableOpacity style={styles.interactionItem} onPress={onUpvote}>
              <IconButton
                icon="arrow-up"
                size={20}
                iconColor="#9ca3af"
                style={styles.interactionIcon}
              />
              <Text style={styles.interactionText}>{upvotes.toLocaleString()}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.interactionItem} onPress={onDownvote}>
              <IconButton
                icon="arrow-down"
                size={20}
                iconColor="#9ca3af"
                style={styles.interactionIcon}
              />
              <Text style={styles.interactionText}>{downvotes.toLocaleString()}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
    marginBottom: 8,
    borderRadius: 12,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#E0E5ED',
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  username: {
    color: '#1A1D2E',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  verified: {
    color: '#6B8AFF',
    fontSize: 14,
    marginRight: 4,
  },
  handle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginRight: 4,
  },
  timestamp: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  contentText: {
    color: '#1A1D2E',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  contentImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  interactions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  interactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  interactionIcon: {
    margin: 0,
    width: 32,
    height: 32,
  },
  interactionText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 4,
  },
  selectedItem: {
    backgroundColor: 'rgba(107, 138, 255, 0.1)',
    borderRadius: 8,
  },
  selectedText: {
    color: '#6B8AFF',
    fontWeight: '600',
  },
  lockedItem: {
    opacity: 0.7,
  },
});
