import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import { useMe } from "../hooks/useMe";

type Props = NativeStackScreenProps<RootStackParamList, "ProfileSetup">;

export default function ProfileSetup({ navigation }: Props) {
  const { accessToken } = useAuth();
  const { save } = useMe();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const valid = useMemo(() => username.trim().length >= 3, [username]);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (res.canceled) return;
    const uri = res.assets?.[0]?.uri;
    if (uri) setAvatar(uri);
  };

  const onSave = async () => {
    try {
      if (!accessToken) throw new Error("Not authenticated");
      setLoading(true);
      let avatar_url: string | undefined = undefined;

      if (avatar) {
        const { data: u } = await supabase.auth.getUser();
        const userId = u.user?.id;
        if (!userId) throw new Error("No user");
        const key = `avatars/${userId}/${Date.now()}.jpg`;

        const file = await fetch(avatar);
        const blob = await file.blob();
        const { error: upErr } = await supabase.storage
          .from("posts")
          .upload(key, blob, {
            contentType: "image/jpeg",
            upsert: true,
          });
        if (upErr) throw upErr;
        avatar_url = key;
      }

      await save({
        username: username.trim(),
        full_name: fullName.trim() || undefined,
        avatar_url,
      });
      navigation.replace("Home");
    } catch (e) {
      // noop; add UI error if desired
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.title}>Set up your profile</Text>
          <Text style={styles.sub}>Pick a username and photo</Text>
        </View>

        <View style={styles.form}>
          <TouchableOpacity
            onPress={pickImage}
            style={styles.avatarBox}
            activeOpacity={0.8}
          >
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarText}>Add Photo</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="yourname"
            placeholderTextColor="#9aa3af"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <Text style={styles.label}>Full name (optional)</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your Name"
            placeholderTextColor="#9aa3af"
            autoCapitalize="words"
            style={styles.input}
          />

          <TouchableOpacity
            onPress={onSave}
            disabled={!valid || loading}
            style={[styles.cta, (!valid || loading) && styles.ctaDisabled]}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.ctaText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0e" },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 72 },
  header: { gap: 6, marginBottom: 16 },
  title: { color: "#fff", fontSize: 28, fontWeight: "800" },
  sub: { color: "#a3a3a3" },
  form: { gap: 12 },
  label: { color: "#e5e7eb", fontSize: 14 },
  input: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: "#141419",
    borderWidth: 1,
    borderColor: "#262635",
    color: "#fff",
    fontSize: 16,
  },
  cta: {
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4f46e5",
    marginTop: 6,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  avatarBox: {
    height: 120,
    width: 120,
    borderRadius: 60,
    backgroundColor: "#141419",
    borderWidth: 1,
    borderColor: "#262635",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  avatarText: { color: "#9aa3af" },
  avatar: { height: 120, width: 120, borderRadius: 60 },
});
