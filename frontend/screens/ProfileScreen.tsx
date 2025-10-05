import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { Card, Button } from "react-native-paper";
import BottomNavigation from "../components/BottomNavigation";
import FloatingButton from "../components/FloatingButton";
import { useMe } from "../hooks/useMe";
import { supabase } from "../lib/supabase";
import * as FileSystem from "expo-file-system/legacy";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

export default function ProfileScreen({ navigation }: Props) {
  const [index, setIndex] = useState(2); // Start with settings tab active
  const { me } = useMe();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const initial = (me?.username?.[0] || "U").toUpperCase();

  useEffect(() => {
    let cancelled = false;

    // Don't try to load if me is not yet loaded
    if (!me) return;

    const ensureDir = async (dir: string) => {
      const info = await FileSystem.getInfoAsync(dir);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
    };

    const resolveLatestKey = async (): Promise<string | null> => {
      // Prefer explicit avatar_url saved on profile
      if (me?.avatar_url) {
        console.log("Found avatar_url in profile:", me.avatar_url);
        return me.avatar_url as string;
      }
      // Fallback: try to find latest file in expected folders
      const userId = (me as any)?.user_id as string | undefined;
      if (!userId) {
        console.log("No user_id found in profile");
        return null;
      }
      console.log("Searching for avatar files for user:", userId);
      // Bucket 'avatars' organizes files under <uid>/...
      const tryPrefixes = [`${userId}`];
      for (const prefix of tryPrefixes) {
        const { data, error } = await supabase.storage
          .from("avatars")
          .list(prefix, {
            limit: 1,
            sortBy: { column: "updated_at", order: "desc" },
          });
        if (!error && data && data.length > 0) {
          console.log("Found avatar file:", `${prefix}/${data[0].name}`);
          return `${prefix}/${data[0].name}`;
        }
      }
      console.log("No avatar files found");
      return null;
    };

    async function loadAvatar() {
      const key = await resolveLatestKey();
      if (!key) {
        if (!cancelled) setAvatarUri(null);
        return;
      }

      try {
        // Use file cache keyed by storage path
        const cacheDir = FileSystem.cacheDirectory + "avatars/";
        await ensureDir(cacheDir);
        const safeName = key.replace(/\//g, "_");
        const cachePath = cacheDir + safeName;
        const existing = await FileSystem.getInfoAsync(cachePath);
        if (existing.exists && existing.size && existing.size > 0) {
          if (!cancelled) setAvatarUri(cachePath);
          return;
        }

        // Download once via signed URL, then serve from cache
        const { data, error } = await supabase.storage
          .from("avatars")
          .createSignedUrl(key, 60 * 10);
        if (error || !data?.signedUrl) {
          console.log("Error creating signed URL:", error);
          throw error || new Error("No signed URL");
        }

        const { uri } = await FileSystem.downloadAsync(
          data.signedUrl,
          cachePath
        );
        if (!cancelled) setAvatarUri(uri);
      } catch (e) {
        console.log("Error loading avatar:", e);
        if (!cancelled) setAvatarUri(null);
      }
    }
    loadAvatar();
    return () => {
      cancelled = true;
    };
  }, [me, me?.avatar_url]);

  const handleTabPress = (key: string) => {
    if (key === "home") {
      navigation.replace("Home", {});
    } else if (key === "commitments") {
      navigation.replace("Commitments");
    }
  };

  const user = {
    username: me?.username || "User",
    handle: me?.username ? `@${me.username}` : "",
    posts: 0,
    following: 0,
    followers: 0,
  };

  const handleEditProfile = () => {
    Alert.alert("Edit Profile", "Edit profile feature coming soon!");
  };

  const handleEditContacts = () => {
    navigation.navigate("Contacts", {
      phone: "mock-phone",
      username: user.username,
    });
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />

      {/* compact header removed to reduce visual weight */}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.profilePicture}
              resizeMode="cover"
              onError={(e) => {
                console.log("Image load error:", e.nativeEvent.error);
                setAvatarUri(null);
              }}
            />
          ) : (
            <View style={[styles.profilePicture, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>{initial}</Text>
            </View>
          )}
          <Text style={styles.username}>{me?.full_name || user.username}</Text>
          {user.handle ? (
            <Text style={styles.handle}>{user.handle}</Text>
          ) : null}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.posts}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={handleEditProfile}
              style={styles.actionButton}
              labelStyle={styles.actionButtonLabel}
            >
              Edit Profile
            </Button>
            <Button
              mode="outlined"
              onPress={handleEditContacts}
              style={styles.actionButton}
              labelStyle={styles.actionButtonLabel}
            >
              Edit Contacts
            </Button>
          </View>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="text"
              onPress={handleLogout}
              icon="logout"
              labelStyle={styles.logoutButtonLabel}
              contentStyle={styles.logoutButtonContent}
            >
              Logout
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Floating button removed from Profile/Settings to prevent adding challenges from this tab */}

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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E5ED",
  },
  headerTitle: {
    color: "#1A1D2E",
    fontSize: 20,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E5ED",
    marginBottom: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "#6B8AFF",
    overflow: "hidden",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
  },
  avatarInitials: {
    color: "#4B5563",
    fontSize: 28,
    fontWeight: "800",
  },
  username: {
    color: "#1A1D2E",
    fontSize: 22,
    fontWeight: "700",
  },
  handle: {
    color: "#9CA3AF",
    fontSize: 15,
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: "#1A1D2E",
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    paddingHorizontal: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 20,
  },
  logoutButtonLabel: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
  logoutButtonContent: {
    justifyContent: "flex-start",
    paddingLeft: 0,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#000",
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  activeNavItem: {
    backgroundColor: "transparent",
  },
  navIcon: {
    margin: 0,
    width: 24,
    height: 24,
  },
  navText: {
    color: "#9ca3af",
    fontSize: 10,
    marginTop: 2,
  },
  activeNavText: {
    color: "#4f46e5",
  },
});
