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
});
