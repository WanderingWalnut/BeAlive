import React, { useCallback, useEffect, useState } from "react";
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
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { Card, Button, Divider } from "react-native-paper";
import BottomNavigation from "../components/BottomNavigation";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PROFILE_CACHE_KEY = "@profile_data";
const AVATAR_CACHE_KEY = "@profile_avatar_url";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

type ProfileRow = {
  user_id: string;
  username: string | null;
  full_name: string | null;
  // Should be a real storage object key like "<uid>/<timestamp>.jpg"
  avatar_url: string | null;
};

type CachedProfile = ProfileRow & {
  cachedAt: number;
};

export default function ProfileScreen({ navigation }: Props) {
  const [index] = useState(2);

  // profile state from DB
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  // signed HTTPS URL for <Image />
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const displayName = profile?.full_name || profile?.username || "User";
  const handle = profile?.username ? `@${profile.username}` : "";
  const initial = (
    profile?.full_name?.[0] ||
    profile?.username?.[0] ||
    "U"
  ).toUpperCase();

  // --- Data loading ---------------------------------------------------------

  async function fetchProfileForCurrentUser(forceRefresh = false) {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;

    if (!uid) {
      // Not logged in: kick to login
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      return;
    }

    // Load from cache first if not forcing refresh
    if (!forceRefresh) {
      try {
        const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
        if (cached) {
          const cachedProfile: CachedProfile = JSON.parse(cached);
          // Use cached data if it's less than 5 minutes old
          if (Date.now() - cachedProfile.cachedAt < 5 * 60 * 1000) {
            setProfile(cachedProfile);
            setLoading(false);
          }
        }

        // Load cached avatar URL
        const cachedAvatar = await AsyncStorage.getItem(AVATAR_CACHE_KEY);
        if (cachedAvatar) {
          setAvatarUrl(cachedAvatar);
        }
      } catch (err) {
        console.error("Error loading cached profile:", err);
      }
    }

    // Fetch fresh data in the background
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, avatar_url")
        .eq("user_id", uid)
        .single<ProfileRow>();

      let profileData: ProfileRow;
      if (!error && data) {
        profileData = data;
      } else {
        // profile row doesn't exist yet — still show something
        profileData = {
          user_id: uid,
          username: null,
          full_name: null,
          avatar_url: null,
        };
      }

      // Update state
      setProfile(profileData);

      // Cache the profile data
      try {
        const cached: CachedProfile = {
          ...profileData,
          cachedAt: Date.now(),
        };
        await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cached));
      } catch (err) {
        console.error("Error caching profile:", err);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Resolve a signed HTTPS URL for the user's avatar.
   * Prefer a real object key from:
   *   1) profiles.avatar_url (must include a "/")
   *   2) auth.user.user_metadata.avatar_url (must include a "/")
   * If neither is usable, optionally list newest object in the user's folder.
   */
  async function resolveAvatarSimple(profileRow: ProfileRow | null) {
    // Don't clear avatar if we already have a cached one
    // setAvatarUrl(null);

    // get current auth user for metadata + fallback uid
    const { data: auth } = await supabase.auth.getUser();
    const uid = profileRow?.user_id || auth.user?.id;

    const metaKey = (auth.user?.user_metadata as any)?.avatar_url as
      | string
      | undefined;
    const keyFromProfile = profileRow?.avatar_url ?? null;

    // must include a slash to be a file, not just the folder/uid
    const candidateKey =
      (keyFromProfile && keyFromProfile.includes("/") && keyFromProfile) ||
      (metaKey && metaKey.includes("/") && metaKey) ||
      null;

    if (candidateKey) {
      try {
        const { data, error } = await supabase.storage
          .from("avatars")
          .createSignedUrl(candidateKey, 60 * 10);
        if (!error && data?.signedUrl) {
          const signedUrl = `${data.signedUrl}&t=${Date.now()}`;
          setAvatarUrl(signedUrl);
          // Cache the avatar URL
          try {
            await AsyncStorage.setItem(AVATAR_CACHE_KEY, signedUrl);
          } catch (err) {
            console.error("Error caching avatar URL:", err);
          }
          return;
        }
      } catch {
        // fall through to folder listing
      }
    }

    // Last resort: list the newest object under /<uid>
    if (!uid) return;
    try {
      const { data, error } = await supabase.storage.from("avatars").list(uid, {
        limit: 1,
        sortBy: { column: "updated_at", order: "desc" },
      });

      if (error || !data?.length) return;

      const newestKey = `${uid}/${data[0].name}`;
      const signed = await supabase.storage
        .from("avatars")
        .createSignedUrl(newestKey, 60 * 10);

      if (signed.data?.signedUrl) {
        const signedUrl = `${signed.data.signedUrl}&t=${Date.now()}`;
        setAvatarUrl(signedUrl);
        // Cache the avatar URL
        try {
          await AsyncStorage.setItem(AVATAR_CACHE_KEY, signedUrl);
        } catch (err) {
          console.error("Error caching avatar URL:", err);
        }
      }
    } catch {
      // ignore; avatar remains null -> initial fallback renders
    }
  }

  // Load profile whenever the screen focuses
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        // Load from cache first, then refresh in background
        await fetchProfileForCurrentUser(false);
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  // When profile changes, resolve avatar
  useEffect(() => {
    if (!profile) return;
    resolveAvatarSimple(profile);
  }, [profile?.avatar_url, profile?.user_id]);

  // --- UI actions -----------------------------------------------------------

  const handleTabPress = (key: string) => {
    if (key === "home") navigation.replace("Home", {});
    else if (key === "commitments") navigation.replace("Commitments");
  };

  const handleEditProfile = () => {
    Alert.alert("Edit Profile", "Edit profile feature coming soon!");
  };

  const handleEditContacts = () => {
    navigation.navigate("Contacts", {
      phone: "mock-phone",
      username: profile?.username || "user",
    });
  };

  const performLogout = async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.multiRemove([
        "userPosts",
        "userChallenges",
        PROFILE_CACHE_KEY,
        AVATAR_CACHE_KEY,
        "@commitments_cache",
      ]);
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch {
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: performLogout },
    ]);
  };

  // --- Render ---------------------------------------------------------------

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeaderStrip} />

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatar}
                resizeMode="cover"
                onError={() => setAvatarUrl(null)}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}
          </View>

          <Text style={styles.nameText}>{displayName}</Text>
          {!!handle && <Text style={styles.handleText}>{handle}</Text>}

          <View style={styles.heroSpacer} />

          <View style={styles.actionsRow}>
            <Button
              mode="contained"
              onPress={handleEditProfile}
              style={[styles.actionBtn, styles.actionPrimary]}
              labelStyle={styles.actionPrimaryLabel}
            >
              Edit Profile
            </Button>
            <Button
              mode="outlined"
              onPress={handleEditContacts}
              style={[styles.actionBtn, styles.actionSecondary]}
              labelStyle={styles.actionSecondaryLabel}
            >
              Edit Contacts
            </Button>
          </View>
        </View>

        {/* Account Section */}
        <Card style={styles.sectionCard}>
          <Card.Title title="Account" titleStyle={styles.sectionTitle} />
          <Divider />
          <TouchableOpacity style={styles.row} onPress={handleLogout}>
            <Text style={styles.rowText}>Logout</Text>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>

      <BottomNavigation currentIndex={index} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const COLOR = {
  bg: "#F8FAFB",
  card: "#FFFFFF",
  border: "#E5E7EB",
  text: "#0F172A",
  subtext: "#6B7280",
  primary: "#6B8AFF",
  primaryDark: "#5C79FF",
  shadow: "#000000",
  avatarRing: "#DCE3FF",
  danger: "#EF4444",
};

const shadow = Platform.select({
  ios: {
    shadowColor: COLOR.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  android: { elevation: 4 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 84 },

  profileCard: {
    backgroundColor: COLOR.card,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
    ...shadow,
  },
  profileHeaderStrip: { height: 64, backgroundColor: "#EEF2FF" },

  avatarWrap: { alignItems: "center", marginTop: -38, marginBottom: 8 },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 3,
    borderColor: COLOR.avatarRing,
    backgroundColor: "#E5E7EB",
  },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 40, fontWeight: "800", color: "#4B5563" },

  nameText: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    color: COLOR.text,
    marginTop: 6,
  },
  handleText: {
    textAlign: "center",
    fontSize: 13,
    color: COLOR.subtext,
    marginTop: 4,
  },

  heroSpacer: { height: 10 },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionBtn: { flex: 1, borderRadius: 12 },
  actionPrimary: { backgroundColor: COLOR.primary },
  actionPrimaryLabel: { color: "#fff", fontWeight: "700" },
  actionSecondary: { borderColor: COLOR.border, backgroundColor: "#fff" },
  actionSecondaryLabel: { color: COLOR.text, fontWeight: "700" },

  sectionCard: {
    backgroundColor: COLOR.card,
    borderRadius: 18,
    marginTop: 6,
    ...shadow,
  },
  sectionTitle: { fontSize: 14, color: COLOR.subtext, fontWeight: "700" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 18,
    justifyContent: "space-between",
  },
  rowText: { fontSize: 16, color: COLOR.danger, fontWeight: "700" },
  rowChevron: { fontSize: 20, color: COLOR.subtext, marginLeft: 8 },
});
