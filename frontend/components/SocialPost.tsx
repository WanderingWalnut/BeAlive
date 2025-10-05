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
  userCommitment,
  onCommit,
}: SocialPostProps) {
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
    backgroundColor: '#000',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  verified: {
    color: '#4f46e5',
    fontSize: 14,
    marginRight: 4,
  },
  handle: {
    color: '#9ca3af',
    fontSize: 14,
    marginRight: 4,
  },
  timestamp: {
    color: '#6b7280',
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  contentText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  contentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
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
    color: '#9ca3af',
    fontSize: 14,
    marginLeft: 4,
  },
  selectedItem: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderRadius: 8,
  },
  selectedText: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  lockedItem: {
    opacity: 0.7,
  },
});
