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
  Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { Card, Button, Divider } from "react-native-paper";
import BottomNavigation from "../components/BottomNavigation";
import { useMe } from "../hooks/useMe";
import { supabase } from "../lib/supabase";
import * as FileSystem from "expo-file-system/legacy";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

export default function ProfileScreen({ navigation }: Props) {
  const [index, setIndex] = useState(2);
  const { me } = useMe();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const initial = (me?.username?.[0] || "U").toUpperCase();

  useEffect(() => {
    let cancelled = false;
    if (!me) return;

    const ensureDir = async (dir: string) => {
      const info = await FileSystem.getInfoAsync(dir);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
    };

    const resolveLatestKey = async (): Promise<string | null> => {
      if (me?.avatar_url) return me.avatar_url as string;

      const userId = (me as any)?.user_id as string | undefined;
      if (!userId) return null;

      const { data, error } = await supabase.storage
        .from("avatars")
        .list(userId, {
          limit: 1,
          sortBy: { column: "updated_at", order: "desc" },
        });

      if (!error && data && data.length > 0) {
        return `${userId}/${data[0].name}`;
      }
      return null;
    };

    async function loadAvatar() {
      const key = await resolveLatestKey();
      if (!key) {
        if (!cancelled) setAvatarUri(null);
        return;
      }

      try {
        const cacheDir = FileSystem.cacheDirectory + "avatars/";
        await ensureDir(cacheDir);
        const safeName = key.replace(/\//g, "_");
        const cachePath = cacheDir + safeName;
        const existing = await FileSystem.getInfoAsync(cachePath);
        if (existing.exists && existing.size && existing.size > 0) {
          if (!cancelled) setAvatarUri(cachePath);
          return;
        }

        const { data, error } = await supabase.storage
          .from("avatars")
          .createSignedUrl(key, 60 * 10);

        if (error || !data?.signedUrl)
          throw error || new Error("No signed URL");

        const { uri } = await FileSystem.downloadAsync(
          data.signedUrl,
          cachePath
        );
        if (!cancelled) setAvatarUri(uri);
      } catch {
        if (!cancelled) setAvatarUri(null);
      }
    }
    loadAvatar();
    return () => {
      cancelled = true;
    };
  }, [me, me?.avatar_url]);

  const handleTabPress = (key: string) => {
    if (key === "home") navigation.replace("Home", {});
    else if (key === "commitments") navigation.replace("Commitments");
  };

  const user = {
    username: me?.full_name || me?.username || "User",
    handle: me?.username ? `@${me.username}` : "",
  };

  const handleEditProfile = () => {
    Alert.alert("Edit Profile", "Edit profile feature coming soon!");
  };

  const handleEditContacts = () => {
    navigation.navigate("Contacts", {
      phone: "mock-phone",
      username: me?.username || "user",
    });
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        },
      },
    ]);
  };

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

          {/* Avatar overlaps header strip */}
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatar}
                resizeMode="cover"
                onError={() => setAvatarUri(null)}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}
          </View>

          <Text style={styles.nameText}>{user.username}</Text>
          {!!user.handle && (
            <Text style={styles.handleText}>{user.handle}</Text>
          )}

          {/* extra breathing room between name and buttons */}
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
  android: {
    elevation: 4,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },

  // less outer padding so the card sits higher & reduces empty space
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 84 },

  // Profile card
  profileCard: {
    backgroundColor: COLOR.card,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
    ...shadow,
  },
  profileHeaderStrip: {
    height: 64,
    backgroundColor: "#EEF2FF",
  },
  avatarWrap: {
    alignItems: "center",
    marginTop: -38,
    marginBottom: 8,
  },
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

  // adds breathing room before buttons
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

  // Sections
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
