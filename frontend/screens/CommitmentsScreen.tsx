import React, { useState, useEffect, useCallback } from "react";
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
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import BottomNavigation from "../components/BottomNavigation";
import { useCommitments } from "../contexts/CommitmentsContext";
import { IconButton } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../lib/supabase";
import { getMyCommitments } from "../lib/api/commitments";
import { getChallenge, getFeed } from "../lib/api";
import type { CommitmentOut, ChallengeOut, PostWithCounts } from "../lib/types";

const COMMITMENTS_CACHE_KEY = "@commitments_cache";

interface Commitment {
  id: string;
  challengeTitle: string;
  creator: {
    username: string;
    handle: string;
    avatar?: string;
    initial?: string;
  };
  expiry: string;
  userChoice: "yes" | "no";
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
  outcome?: "yes" | "no";
}

type Props = NativeStackScreenProps<RootStackParamList, "Commitments">;

export default function CommitmentsScreen({ navigation }: Props) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(1);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve avatar URL for a user
  const resolveUserAvatar = useCallback(
    async (
      userId: string,
      avatarKey: string | null
    ): Promise<string | null> => {
      const candidateKey =
        avatarKey && avatarKey.includes("/") ? avatarKey : null;

      if (candidateKey) {
        try {
          const { data, error } = await supabase.storage
            .from("avatars")
            .createSignedUrl(candidateKey, 60 * 10);
          if (!error && data?.signedUrl) {
            return `${data.signedUrl}&t=${Date.now()}`;
          }
        } catch {
          // fall through to folder listing
        }
      }

      // Last resort: list the newest object under /<uid>
      try {
        const { data, error } = await supabase.storage
          .from("avatars")
          .list(userId, {
            limit: 1,
            sortBy: { column: "updated_at", order: "desc" },
          });

        if (error || !data?.length) return null;

        const newestKey = `${userId}/${data[0].name}`;
        const signed = await supabase.storage
          .from("avatars")
          .createSignedUrl(newestKey, 60 * 10);

        if (signed.data?.signedUrl) {
          return `${signed.data.signedUrl}&t=${Date.now()}`;
        }
      } catch {
        return null;
      }

      return null;
    },
    []
  );

  // Fetch commitments from database
  const fetchCommitments = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setCommitments([]);
          setLoading(false);
          return;
        }

        // Load from cache first if not forcing refresh
        if (!forceRefresh) {
          try {
            const cached = await AsyncStorage.getItem(COMMITMENTS_CACHE_KEY);
            if (cached) {
              const cachedCommitments = JSON.parse(cached);
              setCommitments(cachedCommitments);
              setLoading(false);
            }
          } catch (err) {
            console.error("Error loading cached commitments:", err);
          }
        }

        // Get commitments from API
        const dbCommitments = await getMyCommitments(session.access_token);

        // Enrich each commitment with challenge and post data
        const enrichedCommitments: Commitment[] = [];

        for (const commitment of dbCommitments) {
          try {
            // Fetch challenge details
            const challenge = await getChallenge(
              session.access_token,
              commitment.challenge_id
            );

            // Fetch post/feed data for counts
            const feedResponse = await getFeed(session.access_token);
            const post = feedResponse.items.find(
              (p) => p.challenge_id === commitment.challenge_id
            );

            // Get challenge owner profile
            let creatorUsername = "Unknown User";
            let creatorHandle = "@unknown";
            let creatorAvatar: string | null = null;
            let creatorInitial = "U";

            try {
              const { data: profile } = await supabase
                .from("profiles")
                .select("username, full_name, avatar_url")
                .eq("user_id", challenge.owner_id)
                .single();

              if (profile) {
                creatorUsername =
                  profile.full_name || profile.username || "Unknown User";
                creatorHandle = profile.username
                  ? `@${profile.username}`
                  : "@unknown";
                creatorInitial = (
                  profile.full_name?.[0] ||
                  profile.username?.[0] ||
                  "U"
                ).toUpperCase();

                // Resolve avatar URL
                creatorAvatar = await resolveUserAvatar(
                  challenge.owner_id,
                  profile.avatar_url
                );
              }
            } catch (err) {
              console.error("Error fetching creator profile:", err);
            }

            const poolYes = post
              ? post.for_amount_cents / 100
              : challenge.amount_cents / 100;
            const poolNo = post ? post.against_amount_cents / 100 : 0;
            const participantsYes = post
              ? post.for_count
              : commitment.side === "for"
              ? 1
              : 0;
            const participantsNo = post
              ? post.against_count
              : commitment.side === "against"
              ? 1
              : 0;

            const totalPool = poolYes + poolNo;
            const userSidePool = commitment.side === "for" ? poolYes : poolNo;
            const expectedPayout =
              userSidePool > 0
                ? (challenge.amount_cents / 100 / userSidePool) * totalPool
                : challenge.amount_cents / 100;

            enrichedCommitments.push({
              id: commitment.id.toString(),
              challengeTitle: challenge.title,
              creator: {
                username: creatorUsername,
                handle: creatorHandle,
                avatar: creatorAvatar || undefined,
                initial: creatorInitial,
              },
              expiry:
                challenge.ends_at ||
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              userChoice: commitment.side === "for" ? "yes" : "no",
              stake: challenge.amount_cents / 100,
              poolYes,
              poolNo,
              participantsYes,
              participantsNo,
              expectedPayout,
              image: post?.media_url ? getImageUrl(post.media_url) : undefined,
              updates: [],
              isExpired: challenge.ends_at
                ? new Date(challenge.ends_at) < new Date()
                : false,
            });
          } catch (err) {
            console.error(`Error enriching commitment ${commitment.id}:`, err);
          }
        }

        // Only update if data has changed
        const currentData = JSON.stringify(commitments);
        const newData = JSON.stringify(enrichedCommitments);

        if (currentData !== newData) {
          setCommitments(enrichedCommitments);

          // Save to cache
          try {
            await AsyncStorage.setItem(
              COMMITMENTS_CACHE_KEY,
              JSON.stringify(enrichedCommitments)
            );
          } catch (err) {
            console.error("Error saving commitments to cache:", err);
          }
        }
      } catch (err) {
        console.error("Error fetching commitments:", err);
        setError("Failed to load commitments");
      } finally {
        setLoading(false);
      }
    },
    [commitments, resolveUserAvatar]
  );

  // Helper to get image URL
  const getImageUrl = (mediaUrl: string | null): string | undefined => {
    if (!mediaUrl) return undefined;
    if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) {
      return mediaUrl;
    }
    try {
      const { data } = supabase.storage.from("posts").getPublicUrl(mediaUrl);
      return data?.publicUrl || undefined;
    } catch (err) {
      console.error("Error getting image URL:", err);
      return undefined;
    }
  };

  // Load commitments on mount and when screen comes into focus
  useEffect(() => {
    fetchCommitments(false); // Load from cache first
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchCommitments(true); // Force refresh when screen comes into focus
    });
    return unsubscribe;
  }, [navigation]);

  const handleTabPress = (key: string) => {
    if (key === "home") {
      navigation.replace("Home", {} as any);
    } else if (key === "settings") {
      navigation.replace("Profile");
    }
  };

  const formatTimeRemaining = (expiry: string) => {
    const now = new Date();
    const expiryDate = new Date(expiry);
    const diffMs = expiryDate.getTime() - now.getTime();

    if (diffMs <= 0) return { text: "Expired", color: "#ef4444" };

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    if (days > 7) return { text: `${days} days left`, color: "#10b981" };
    if (days > 0) return { text: `${days}d ${hours}h left`, color: "#f59e0b" };
    return { text: `${hours}h left`, color: "#ef4444" };
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
    const userSidePool = item.userChoice === "yes" ? item.poolYes : item.poolNo;
    const otherSidePool =
      item.userChoice === "yes" ? item.poolNo : item.poolYes;
    const userSidePercent =
      totalPool > 0 ? Math.round((userSidePool / totalPool) * 100) : 50;
    const potentialReturn = item.expectedPayout - item.stake;
    const roi =
      item.stake > 0 ? Math.round((potentialReturn / item.stake) * 100) : 0;

    return {
      totalPool,
      userSidePool,
      otherSidePool,
      userSidePercent,
      potentialReturn,
      roi,
    };
  };

  const renderSummaryCard = () => {
    if (commitments.length === 0) return null;

    const totalCommitments = commitments.length;
    const activeCommitments = commitments.filter(
      (commitment) => !commitment.isExpired
    ).length;
    const supportingCount = commitments.filter(
      (c) => c.userChoice === "yes"
    ).length;

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Your Journey</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>{totalCommitments}</Text>
            <Text style={styles.summaryStatLabel}>Total Challenges</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStatItem}>
            <Text style={[styles.summaryStatValue, { color: "#10b981" }]}>
              {activeCommitments}
            </Text>
            <Text style={styles.summaryStatLabel}>Active Goals</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>{supportingCount}</Text>
            <Text style={styles.summaryStatLabel}>Backing Friends</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCommitmentCard = ({ item }: { item: Commitment }) => {
    const isExpanded = expandedCards.has(item.id);
    const timeInfo = formatTimeRemaining(item.expiry);
    const stats = calculateStats(item);
    const hasExpired = timeInfo.text === "Expired";
    const userWon = hasExpired && item.outcome === item.userChoice;

    // Calculate percentages based on participant counts, not money
    const totalParticipants = item.participantsYes + item.participantsNo;
    const supportingPercent =
      totalParticipants > 0
        ? Math.round((item.participantsYes / totalParticipants) * 100)
        : 50;
    const challengingPercent = 100 - supportingPercent;

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
            {item.creator.avatar ? (
              <Image
                source={{ uri: item.creator.avatar }}
                style={styles.creatorAvatar}
              />
            ) : (
              <View style={[styles.creatorAvatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>
                  {item.creator.initial || "U"}
                </Text>
              </View>
            )}
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorName}>{item.creator.username}</Text>
              <Text style={styles.creatorHandle}>{item.creator.handle}</Text>
            </View>
            <View
              style={[
                styles.timeBadge,
                { backgroundColor: `${timeInfo.color}20` },
              ]}
            >
              <Text style={[styles.timeText, { color: timeInfo.color }]}>
                {timeInfo.text}
              </Text>
            </View>
          </View>

          {/* Goal Title */}
          <View style={styles.goalContainer}>
            <Text style={styles.goalLabel}>Goal</Text>
            <Text style={styles.challengeTitle} numberOfLines={2}>
              {item.challengeTitle}
            </Text>
          </View>

          {/* Your Role */}
          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>YOUR ROLE</Text>
            <View
              style={[
                styles.roleValue,
                item.userChoice === "yes"
                  ? styles.supportingRole
                  : styles.challengingRole,
              ]}
            >
              <Text style={styles.roleText}>
                {item.userChoice === "yes" ? "✓ Supporting" : "⚡ Challenging"}
              </Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {item.userChoice === "yes" ? "Believer" : "Motivator"}
                </Text>
              </View>
            </View>
          </View>

          {/* Community Pulse */}
          {!hasExpired && (
            <View style={styles.communityPulse}>
              <Text style={styles.communityLabel}>Community Pulse</Text>
              <View style={styles.pulseBar}>
                <View
                  style={[
                    styles.pulseBarFill,
                    { width: `${supportingPercent}%` },
                  ]}
                />
              </View>
              <View style={styles.pulseLabels}>
                <View style={styles.pulseLabelItem}>
                  <View
                    style={[styles.pulseDot, { backgroundColor: "#10b981" }]}
                  />
                  <Text style={styles.pulseLabelText}>
                    Supporting: {item.participantsYes} ({supportingPercent}%)
                  </Text>
                </View>
                <View style={styles.pulseLabelItem}>
                  <View
                    style={[styles.pulseDot, { backgroundColor: "#f59e0b" }]}
                  />
                  <Text style={styles.pulseLabelText}>
                    Challenging: {item.participantsNo} ({challengingPercent}%)
                  </Text>
                </View>
              </View>
              <Text style={styles.communityEncouragement}>
                Friends are keeping each other accountable
              </Text>
            </View>
          )}

          {/* Outcome (if expired) */}
          {hasExpired && (
            <View
              style={[
                styles.outcomeContainer,
                userWon ? styles.outcomeSuccess : styles.outcomeComplete,
              ]}
            >
              <View style={styles.outcomeContent}>
                <IconButton
                  icon={userWon ? "star-circle" : "check-circle"}
                  size={24}
                  iconColor={userWon ? "#10b981" : "#6B8AFF"}
                  style={styles.outcomeIcon}
                />
                <View style={styles.outcomeTextContainer}>
                  <Text
                    style={[
                      styles.outcomeText,
                      { color: userWon ? "#10b981" : "#6B8AFF" },
                    ]}
                  >
                    {userWon ? "Goal Achieved!" : "Challenge Completed"}
                  </Text>
                  <Text style={styles.outcomeSubtext}>
                    {userWon
                      ? "Your belief in them was spot on!"
                      : "Every step forward counts"}
                  </Text>
                  {/* Impact breakdown */}
                  {hasExpired && (
                    <View style={styles.impactContainer}>
                      <Text style={styles.impactTitle}>Community Impact</Text>
                      <Text style={styles.impactText}>
                        {item.participantsYes + item.participantsNo} friends
                        stayed engaged
                      </Text>
                      <Text style={styles.impactText}>
                        Supporting: {item.participantsYes} • Challenging:{" "}
                        {item.participantsNo}
                      </Text>
                      {item.outcome && (
                        <Text style={styles.impactText}>
                          Outcome:{" "}
                          {item.outcome === "yes"
                            ? "Goal achieved"
                            : "Goal not met"}
                        </Text>
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
              {isExpanded ? "Show Less" : "View Details"}
            </Text>
            <IconButton
              icon={isExpanded ? "chevron-up" : "chevron-down"}
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
                  <Text style={styles.statValue}>
                    {item.participantsYes + item.participantsNo}
                  </Text>
                  <Text style={styles.statLabel}>Friends Engaged</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{item.participantsYes}</Text>
                  <Text style={styles.statLabel}>Supporting</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{item.participantsNo}</Text>
                  <Text style={styles.statLabel}>Challenging</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {item.updates ? item.updates.length : 0}
                  </Text>
                  <Text style={styles.statLabel}>Progress Updates</Text>
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
                          {new Date(update.timestamp).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
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
      <Text style={styles.emptyTitle}>Start Your Journey</Text>
      <Text style={styles.emptyText}>
        Support your friends' goals and help each other stay accountable
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.replace("Home", {} as any)}
      >
        <Text style={styles.emptyButtonText}>Explore Challenges</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B8AFF" />
          <Text style={styles.loadingText}>Loading your journey...</Text>
        </View>
        <BottomNavigation currentIndex={index} onTabPress={handleTabPress} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchCommitments(true)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
        <BottomNavigation currentIndex={index} onTabPress={handleTabPress} />
      </SafeAreaView>
    );
  }

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
      <BottomNavigation currentIndex={index} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFB",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E5ED",
  },
  headerTitle: {
    color: "#1A1D2E",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E5ED",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    color: "#1A1D2E",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryStatItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryStatValue: {
    color: "#1A1D2E",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  summaryStatLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    textAlign: "center",
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E0E5ED",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0E5ED",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImageContainer: {
    width: "100%",
    height: 180,
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  creatorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: "#E5E7EB",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B5563",
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    color: "#1A1D2E",
    fontSize: 14,
    fontWeight: "600",
  },
  impactContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#F8FAFB",
    borderRadius: 8,
  },
  impactTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A1D2E",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  impactText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 3,
  },
  creatorHandle: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  timeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  goalContainer: {
    marginBottom: 12,
  },
  goalLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  challengeTitle: {
    color: "#1A1D2E",
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 24,
  },
  roleContainer: {
    marginBottom: 16,
  },
  roleLabel: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  roleValue: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  supportingRole: {
    backgroundColor: "#10b98115",
    borderWidth: 1,
    borderColor: "#10b98130",
  },
  challengingRole: {
    backgroundColor: "#f59e0b15",
    borderWidth: 1,
    borderColor: "#f59e0b30",
  },
  roleText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1D2E",
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F8FAFB",
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B8AFF",
  },
  communityPulse: {
    marginBottom: 16,
  },
  communityLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pulseBar: {
    height: 8,
    backgroundColor: "#f59e0b20",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  pulseBarFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 4,
  },
  pulseLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pulseLabelItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  pulseLabelText: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "500",
  },
  communityEncouragement: {
    color: "#9CA3AF",
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 4,
  },
  outcomeContainer: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  outcomeSuccess: {
    backgroundColor: "#10b98112",
    borderWidth: 1,
    borderColor: "#10b98130",
  },
  outcomeComplete: {
    backgroundColor: "#6B8AFF12",
    borderWidth: 1,
    borderColor: "#6B8AFF30",
  },
  outcomeContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  outcomeIcon: {
    margin: 0,
    marginTop: -2,
  },
  outcomeTextContainer: {
    flex: 1,
  },
  outcomeText: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  outcomeSubtext: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 8,
  },
  expandToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E0E5ED",
  },
  expandText: {
    color: "#6B8AFF",
    fontSize: 13,
    fontWeight: "600",
  },
  expandIcon: {
    margin: 0,
  },
  expandedSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E5ED",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    gap: 8,
  },
  statBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F8FAFB",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  statValue: {
    color: "#1A1D2E",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    textAlign: "center",
  },
  updatesSection: {
    marginTop: 8,
  },
  sectionTitle: {
    color: "#1A1D2E",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  updateCard: {
    backgroundColor: "#F8FAFB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  updateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  updateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6B8AFF",
    marginRight: 8,
  },
  updateTime: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "600",
  },
  updateText: {
    color: "#1A1D2E",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  updateImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    resizeMode: "cover",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F8FAFB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyIcon: {
    margin: 0,
  },
  emptyTitle: {
    color: "#1A1D2E",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: "#6B8AFF",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#9CA3AF",
    fontSize: 15,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#6B8AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
