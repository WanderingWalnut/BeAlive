import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { IconButton } from "react-native-paper";

interface Update {
  id: string;
  content: string;
  image?: string;
  timestamp: string;
}

interface SocialPostProps {
  id: string;
  username: string;
  handle: string;
  avatar?: string | null;
  userInitial?: string;
  timestamp: string;
  // New split: title and caption. Keep `content` as fallback for older posts.
  title?: string;
  caption?: string;
  content?: string;
  image?: string;
  verified?: boolean;
  upvotes: number;
  downvotes: number;
  updates?: Update[];
  onUpvote: () => void;
  onDownvote: () => void;
  // Commitment-related properties
  stake?: number;
  poolYes?: number;
  poolNo?: number;
  participantsYes?: number;
  participantsNo?: number;
  expiry?: string;
  userCommitment?: {
    choice: "yes" | "no";
    locked: boolean;
  };
  onCommit?: (choice: "yes" | "no") => void;
}

export default function SocialPost({
  username,
  handle,
  avatar,
  userInitial = "U",
  timestamp,
  title,
  caption,
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
  updates = [],
}: SocialPostProps) {
  const displayTitle = title || content || "";
  const displayCaption = caption || (title ? "" : content) || "";
  // Format expiry date (show days and hours)
  const formatExpiry = (expiryDate: string | undefined) => {
    if (!expiryDate) return "";

    const now = new Date();
    const expDate = new Date(expiryDate);
    const diffMs = expDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    if (diffDays > 0) return `${diffDays}d ${diffHours}h left`;
    if (diffHours > 0) return `${diffHours}h left`;
    return "Ending soon";
  };

  // Format timestamps for display; accept ISO strings or friendly labels like 'Just now'
  const formatTimestamp = (ts: string | undefined) => {
    if (!ts) return "";
    // If it's not a parseable date, return as-is (handles 'Just now')
    if (isNaN(Date.parse(ts))) return ts;
    try {
      const d = new Date(ts);
      // Return date only (e.g. "Oct 5") — no time displayed per request
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch (e) {
      return ts;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header: left = avatar + title/handle, right = timestamp + expiry */}
      <View style={styles.header}>
        <View style={styles.leftRow}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{userInitial}</Text>
            </View>
          )}
          <View style={styles.userDetails}>
            {/* Title goes at the top */}
            <Text style={styles.postTitle} accessibilityRole="header">
              {displayTitle}
            </Text>
          </View>
        </View>

        <View style={styles.rightInfo}>
          <Text style={styles.timestamp}>{formatTimestamp(timestamp)}</Text>
          {expiry && (
            <Text style={styles.expiryText}>{formatExpiry(expiry)}</Text>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {displayCaption ? (
          <Text style={styles.contentText}>{displayCaption}</Text>
        ) : null}
        {image && <Image source={{ uri: image }} style={styles.contentImage} />}
      </View>

      {/* Updates */}
      {updates && updates.length > 0 && (
        <View style={styles.updatesContainer}>
          <Text style={styles.updatesTitle}>Updates</Text>
          {updates.map((update) => (
            <View key={update.id} style={styles.update}>
              <Text style={styles.updateTimestamp}>
                {formatTimestamp(update.timestamp)}
              </Text>
              <Text style={styles.updateContent}>{update.content}</Text>
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

      {/* Interaction Bar */}
      <View style={styles.interactions}>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          {stake && onCommit ? (
            <>
              <TouchableOpacity
                style={[
                  styles.interactionItem,
                  userCommitment?.choice === "yes" && styles.selectedItem,
                  userCommitment?.locked && styles.lockedItem,
                ]}
                onPress={() => !userCommitment?.locked && onCommit("yes")}
                disabled={userCommitment?.locked}
              >
                <IconButton
                  icon="arrow-up"
                  size={20}
                  iconColor={
                    userCommitment?.choice === "yes" ? "#6B8AFF" : "#9CA3AF"
                  }
                  style={styles.interactionIcon}
                />
                <Text
                  style={[
                    styles.interactionText,
                    userCommitment?.choice === "yes" && styles.selectedText,
                  ]}
                >
                  YES
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.interactionItem,
                  userCommitment?.choice === "no" && styles.selectedItem,
                  userCommitment?.locked && styles.lockedItem,
                ]}
                onPress={() => !userCommitment?.locked && onCommit("no")}
                disabled={userCommitment?.locked}
              >
                <IconButton
                  icon="arrow-down"
                  size={20}
                  iconColor={
                    userCommitment?.choice === "no" ? "#6B8AFF" : "#9CA3AF"
                  }
                  style={styles.interactionIcon}
                />
                <Text
                  style={[
                    styles.interactionText,
                    userCommitment?.choice === "no" && styles.selectedText,
                  ]}
                >
                  NO
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.interactionItem}
                onPress={onUpvote}
              >
                <IconButton
                  icon="arrow-up"
                  size={20}
                  iconColor="#9ca3af"
                  style={styles.interactionIcon}
                />
                <Text style={styles.interactionText}>
                  {upvotes.toLocaleString()}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.interactionItem}
                onPress={onDownvote}
              >
                <IconButton
                  icon="arrow-down"
                  size={20}
                  iconColor="#9ca3af"
                  style={styles.interactionIcon}
                />
                <Text style={styles.interactionText}>
                  {downvotes.toLocaleString()}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <Text style={styles.usernameRight}>@{username}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 16,
    marginBottom: 12,
    borderRadius: 12,
    marginHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#E0E5ED",
  },
  avatarFallback: {
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4B5563",
  },
  userDetails: {
    flex: 1,
  },
  postTitle: {
    color: "#1A1D2E",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  headerCaption: {
    color: "#6B7280",
    fontSize: 13,
    marginRight: 8,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
  },
  rightInfo: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
    alignSelf: "flex-start",
    marginLeft: 12,
  },
  username: {
    color: "#1A1D2E",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 4,
  },
  verified: {
    color: "#6B8AFF",
    fontSize: 14,
    marginRight: 4,
  },
  handle: {
    color: "#9CA3AF",
    fontSize: 13,
    marginRight: 6,
  },
  timestamp: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  expiryRow: {
    marginTop: 4,
  },
  expiryText: {
    color: "#6B8AFF",
    fontSize: 12,
    fontWeight: "600",
  },
  usernameRight: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 4,
    maxWidth: 120,
    textAlign: "right",
  },
  handleRowRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  handleRight: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "right",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  contentText: {
    color: "#1A1D2E",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  contentImage: {
    width: "100%",
    height: 240,
    borderRadius: 12,
    resizeMode: "cover",
  },
  interactions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  interactionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
    paddingHorizontal: 8, // avoid text clipping on small buttons
    paddingVertical: 6,
  },
  interactionIcon: {
    margin: 0,
    width: 32,
    height: 32,
  },
  interactionText: {
    color: "#9CA3AF",
    fontSize: 14,
    marginLeft: 4,
  },
  selectedItem: {
    backgroundColor: "rgba(107, 138, 255, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  selectedText: {
    color: "#6B8AFF",
    fontWeight: "600",
  },
  lockedItem: {
    opacity: 0.7,
  },
  updatesContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  updatesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1D2E",
    marginBottom: 8,
  },
  update: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
  },
  updateTimestamp: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  updateContent: {
    fontSize: 14,
    color: "#1A1D2E",
    lineHeight: 20,
  },
  updateImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginTop: 8,
    resizeMode: "cover",
  },
});
