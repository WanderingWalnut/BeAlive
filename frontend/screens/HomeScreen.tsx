import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  FlatList,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { SocialPost } from "../services/socialData";
import SocialPostComponent from "../components/SocialPost";
import BottomNavigation from "../components/BottomNavigation";
import FloatingButton from "../components/FloatingButton";
import { useCommitments } from "../contexts/CommitmentsContext";
import { supabase } from "../lib/supabase";
import { getFeed, getChallenge } from "../lib/api";
import { createCommitment, getMyCommitment } from "../lib/api/commitments";
import type { PostWithCounts, ChallengeOut } from "../lib/types";

const FEED_CACHE_KEY = "@feed_cache";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation, route }: Props) {
  const { user: routeUser } = route.params || {};
  const { addCommitment, hasCommitment } = useCommitments();

  // Create a mock user if none provided (for navigation from other screens)
  const user = routeUser || {
    id: "dev-user",
    phone_number: "+1234567890",
    first_name: "Dev",
    last_name: "User",
    created_at: new Date().toISOString(),
  };

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routes] = useState([
    {
      key: "home",
      title: "Home",
      focusedIcon: "home",
      unfocusedIcon: "home-outline",
    },
    {
      key: "settings",
      title: "Settings",
      focusedIcon: "cog",
      unfocusedIcon: "cog-outline",
    },
  ]);

  // Helper function to convert storage path to public URL
  const getImageUrl = useCallback(
    (mediaUrl: string | null): string | undefined => {
      if (!mediaUrl) return undefined;

      // If it's already a full URL, return as-is
      if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) {
        return mediaUrl;
      }

      // Otherwise, treat it as a storage path and get the public URL
      try {
        const { data } = supabase.storage.from("posts").getPublicUrl(mediaUrl);

        return data?.publicUrl || undefined;
      } catch (err) {
        console.error("Error getting image URL:", err);
        return undefined;
      }
    },
    []
  );

  // Resolve avatar URL for a user
  const resolveUserAvatar = useCallback(
    async (
      userId: string,
      avatarKey: string | null
    ): Promise<string | null> => {
      // Must include a slash to be a file, not just the folder/uid
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

  // Convert backend PostWithCounts + ChallengeOut to frontend SocialPost format
  const mapPostToSocialPost = useCallback(
    async (
      post: PostWithCounts,
      challenge: ChallengeOut,
      accessToken: string
    ): Promise<SocialPost> => {
      // Get author profile info
      let username = "Unknown User";
      let handle = "@unknown";
      let avatarUrl: string | null = null;
      let userInitial = "U";

      try {
        // Fetch profile from Supabase profiles table directly
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, full_name, avatar_url")
          .eq("user_id", post.author_id)
          .single();

        if (profile) {
          username = profile.full_name || profile.username || "Unknown User";
          handle = profile.username ? `@${profile.username}` : "@unknown";
          userInitial = (
            profile.full_name?.[0] ||
            profile.username?.[0] ||
            "U"
          ).toUpperCase();

          // Resolve avatar URL
          avatarUrl = await resolveUserAvatar(
            post.author_id,
            profile.avatar_url
          );
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }

      // Convert storage path to public URL if needed
      const imageUrl = getImageUrl(post.media_url);

      // Check if user has already committed to this challenge
      let userCommitment: { choice: "yes" | "no"; locked: boolean } | undefined;
      try {
        const existingCommitment = await getMyCommitment(
          accessToken,
          challenge.id
        );
        if (existingCommitment) {
          userCommitment = {
            choice: existingCommitment.side === "for" ? "yes" : "no",
            locked: true,
          };
        }
      } catch (err) {
        console.error("Error fetching user commitment:", err);
      }

      return {
        id: post.id.toString(),
        challengeId: challenge.id,
        username,
        handle,
        avatar: avatarUrl,
        userInitial,
        timestamp: new Date(post.created_at).toLocaleDateString(),
        content: challenge.title,
        image: imageUrl,
        upvotes: 0, // Not implemented yet
        downvotes: 0, // Not implemented yet
        stake: challenge.amount_cents / 100, // Convert cents to dollars
        poolYes: post.for_amount_cents / 100,
        poolNo: post.against_amount_cents / 100,
        participantsYes: post.for_count,
        participantsNo: post.against_count,
        expiry:
          challenge.ends_at ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        userCommitment,
        updates: [],
      };
    },
    [getImageUrl, resolveUserAvatar]
  );

  // Fetch posts from backend API
  const fetchPosts = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true);
        setError(null);

        // Get the current session token
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          console.log("No session token, user might not be logged in");
          setPosts([]);
          setLoading(false);
          return;
        }

        // Load from cache first if not forcing refresh
        if (!forceRefresh) {
          try {
            const cached = await AsyncStorage.getItem(FEED_CACHE_KEY);
            if (cached) {
              const cachedPosts = JSON.parse(cached);
              setPosts(cachedPosts);
              setLoading(false);
            }
          } catch (err) {
            console.error("Error loading cached feed:", err);
          }
        }

        // Fetch feed from backend
        const feedResponse = await getFeed(session.access_token);
        console.log("Fetched feed:", feedResponse);

        // For each post, fetch the challenge details and map to SocialPost
        const socialPosts: SocialPost[] = [];
        for (const post of feedResponse.items) {
          try {
            const challenge = await getChallenge(
              session.access_token,
              post.challenge_id
            );
            const socialPost = await mapPostToSocialPost(
              post,
              challenge,
              session.access_token
            );
            socialPosts.push(socialPost);
          } catch (err) {
            console.error(`Error processing post ${post.id}:`, err);
            // Skip this post if we can't fetch challenge details
          }
        }

        // Only update if data has changed
        const currentData = JSON.stringify(posts);
        const newData = JSON.stringify(socialPosts);

        if (currentData !== newData) {
          setPosts(socialPosts);

          // Save to cache
          try {
            await AsyncStorage.setItem(
              FEED_CACHE_KEY,
              JSON.stringify(socialPosts)
            );
          } catch (err) {
            console.error("Error saving feed to cache:", err);
          }
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError("Failed to load posts. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [mapPostToSocialPost, posts]
  );

  // When Home screen receives focus, refresh posts from API
  const applyRouteParams = useCallback(async () => {
    try {
      // Refresh the feed from the API (force refresh)
      await fetchPosts(true);

      // Handle route params for backwards compatibility
      const params = route.params || {};
      const { newChallenge, challengeUpdate } = params as any;

      if (newChallenge) {
        console.log("New challenge created, feed refreshed");
        navigation.setParams({ newChallenge: undefined } as any);
        Alert.alert(
          "Success!",
          "Your challenge has been created and shared with friends."
        );
      }

      if (challengeUpdate) {
        console.log("Challenge updated, feed refreshed");
        navigation.setParams({ challengeUpdate: undefined } as any);
        Alert.alert("Success!", "Your update has been posted.");
      }
    } catch (err) {
      console.error("Error refreshing feed:", err);
    }
  }, [navigation, route.params, fetchPosts]);

  // Dev helper: reset AsyncStorage keys and refresh from API
  const handleResetStorage = async () => {
    try {
      await AsyncStorage.removeItem("userPosts");
      await AsyncStorage.removeItem("userChallenges");
      await AsyncStorage.removeItem(FEED_CACHE_KEY);
      await fetchPosts(true);
      Alert.alert(
        "Storage Reset",
        "Cleared local cache and refreshed from server."
      );
      console.log("AsyncStorage cleared and posts refreshed from API");
    } catch (err) {
      console.error("Error clearing AsyncStorage:", err);
      Alert.alert(
        "Error",
        "Failed to clear storage. Check console for details."
      );
    }
  };

  // Load posts on mount
  useEffect(() => {
    fetchPosts(false); // Load from cache first
  }, []);

  // Refresh posts when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      applyRouteParams();
    });
    return unsubscribe;
  }, [navigation, applyRouteParams]);

  const handleCommit = async (postId: string, choice: "yes" | "no") => {
    const post = posts.find((p) => p.id === postId);

    if (!post || !post.stake) {
      return;
    }

    // Check if user already has a commitment on this post (from UI state or DB)
    if (post.userCommitment?.locked || hasCommitment(postId)) {
      Alert.alert(
        "Already Committed",
        "You have already committed to this challenge."
      );
      return;
    }

    const choiceText =
      choice === "yes"
        ? "YES - I believe they will complete this challenge"
        : "NO - I don't think they will complete this challenge";

    Alert.alert(
      "Confirm Your Commitment",
      `${choiceText}\n\nCommit: $${post.stake}\n\nThis commitment will be added to "Commits" and cannot be changed once confirmed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: "default",
          onPress: async () => {
            try {
              // Get the current session token
              const {
                data: { session },
              } = await supabase.auth.getSession();

              if (!session?.access_token) {
                Alert.alert("Error", "You must be logged in to commit.");
                return;
              }

              // Map 'yes'/'no' to 'for'/'against' for the API
              const direction = choice === "yes" ? "for" : "against";

              // Call backend API to save commitment
              const commitment = await createCommitment(
                session.access_token,
                post.challengeId,
                direction as "for" | "against",
                `${postId}-${Date.now()}` // idempotency key
              );

              console.log("Commitment created:", commitment);

              // Optimistically update UI
              const updatedPosts = posts.map((p) => {
                if (p.id === postId) {
                  return {
                    ...p,
                    userCommitment: {
                      choice,
                      locked: true,
                    },
                    poolYes:
                      choice === "yes"
                        ? (p.poolYes || 0) + (p.stake || 0)
                        : p.poolYes || 0,
                    poolNo:
                      choice === "no"
                        ? (p.poolNo || 0) + (p.stake || 0)
                        : p.poolNo || 0,
                    participantsYes:
                      choice === "yes"
                        ? (p.participantsYes || 0) + 1
                        : p.participantsYes || 0,
                    participantsNo:
                      choice === "no"
                        ? (p.participantsNo || 0) + 1
                        : p.participantsNo || 0,
                  };
                }
                return p;
              });

              setPosts(updatedPosts);

              // Add to Commits (context) for local state
              const updatedPoolYes =
                choice === "yes"
                  ? (post.poolYes || 0) + post.stake
                  : post.poolYes || 0;
              const updatedPoolNo =
                choice === "no"
                  ? (post.poolNo || 0) + post.stake
                  : post.poolNo || 0;
              const totalPool = updatedPoolYes + updatedPoolNo;
              const userSidePool =
                choice === "yes" ? updatedPoolYes : updatedPoolNo;
              const expectedPayout =
                userSidePool > 0
                  ? (post.stake / userSidePool) * totalPool
                  : post.stake;

              addCommitment({
                id: commitment.id.toString(),
                postId: postId,
                challengeTitle: post.content,
                creator: {
                  username: post.username,
                  handle: post.handle,
                  avatar: `https://i.pravatar.cc/150?u=${post.username}`,
                },
                userChoice: choice,
                stake: post.stake,
                poolYes: updatedPoolYes,
                poolNo: updatedPoolNo,
                participantsYes:
                  choice === "yes"
                    ? (post.participantsYes || 0) + 1
                    : post.participantsYes || 0,
                participantsNo:
                  choice === "no"
                    ? (post.participantsNo || 0) + 1
                    : post.participantsNo || 0,
                expectedPayout: Math.round(expectedPayout * 100) / 100,
                expiry:
                  post.expiry ||
                  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                image: post.image,
                isExpired: false,
                updates: [],
              });

              // Show success message
              Alert.alert(
                "Commitment Made!",
                `Your commitment has been saved to the database and added to "Commits".`,
                [{ text: "OK" }]
              );

              // Refresh the feed to get updated counts (force refresh)
              await fetchPosts(true);
            } catch (err) {
              console.error("Error saving commitment:", err);
              Alert.alert(
                "Error",
                `Failed to save your commitment: ${
                  err instanceof Error ? err.message : "Unknown error"
                }. Please try again.`
              );
            }
          },
        },
      ]
    );
  };

  const handleTabPress = (key: string) => {
    if (key === "commitments") {
      navigation.replace("Commitments");
    } else if (key === "settings") {
      navigation.replace("Profile");
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        },
      },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No user data available</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />
      {/* App Title + Reset on same row */}
      <View style={[styles.appHeader, styles.headerRow]}>
        <Text style={styles.appTitle}>BeLive</Text>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetStorage}
        >
          <Text style={styles.resetButtonText}>Reset Storage</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {index === 0 && (
          <>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6B8AFF" />
                <Text style={styles.loadingText}>Loading feed...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => fetchPosts(true)}
                >
                  <Text style={styles.buttonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : posts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>Stand by</Text>
                <Text style={styles.emptyText}>
                  No posts yet — create a challenge to get started.
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() =>
                    navigation.navigate("ChallengeCreation" as any)
                  }
                >
                  <Text style={styles.emptyButtonText}>Create Challenge</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <SocialPostComponent
                    {...item}
                    onUpvote={() => {}}
                    onDownvote={() => {}}
                    onCommit={(choice) => handleCommit(item.id, choice)}
                  />
                )}
                contentContainerStyle={styles.feedContainer}
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        )}
      </View>

      {/* Floating + Button - Only on Home Tab */}
      <FloatingButton show={index === 0} />

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
  mainContent: {
    flex: 1,
  },
  scene: {
    flex: 1,
    backgroundColor: "#F8FAFB",
  },
  feedContainer: {
    paddingBottom: 80,
  },
  resetButton: {
    backgroundColor: "#EFEFEF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-end",
    borderRadius: 6,
    margin: 12,
  },
  resetButtonText: {
    color: "#111827",
    fontSize: 12,
  },
  appHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "transparent",
  },
  appTitle: {
    color: "#000000",
    fontSize: 22,
    fontWeight: "800",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    color: "#9CA3AF",
    fontSize: 15,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: "#1A1D2E",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#6B8AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#6B8AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
