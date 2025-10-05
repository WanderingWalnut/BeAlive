import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import { useMe } from "../hooks/useMe";

type Props = NativeStackScreenProps<RootStackParamList, "ProfileSetup">;

const COLORS = {
  bg: "#f9fafb",
  text: "#0f172a",
  subtext: "#475569",
  border: "#e2e8f0",
  primary: "#2563eb",
  error: "#ef4444",
  placeholder: "#9ca3af",
  white: "#ffffff",
};

export default function ProfileSetup({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const { accessToken } = useAuth();
  const { save } = useMe();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [uFocused, setUFocused] = useState(false);
  const [nFocused, setNFocused] = useState(false);

  const valid = useMemo(() => username.trim().length >= 3, [username]);
  const handlePreview = useMemo(
    () =>
      username.trim().length
        ? "@" + username.trim().replace(/\s+/g, "").toLowerCase()
        : "",
    [username]
  );

  // Animations (unchanged)
  const blob1 = useRef(new Animated.Value(0)).current;
  const blob2 = useRef(new Animated.Value(0)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslate = useRef(new Animated.Value(16)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslate = useRef(new Animated.Value(20)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const avatarPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const float = (v: Animated.Value, dur: number, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 1,
            duration: dur,
            delay,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: dur,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    float(blob1, 6000);
    float(blob2, 7200, 400);

    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(heroOpacity, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(heroTranslate, {
          toValue: 0,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(formTranslate, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(avatarPulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(avatarPulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [
    blob1,
    blob2,
    heroOpacity,
    heroTranslate,
    formOpacity,
    formTranslate,
    avatarPulse,
  ]);

  const blob1Style = {
    transform: [
      {
        translateY: blob1.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -14],
        }),
      },
      {
        translateX: blob1.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 10],
        }),
      },
    ],
  };
  const blob2Style = {
    transform: [
      {
        translateY: blob2.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 12],
        }),
      },
      {
        translateX: blob2.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -10],
        }),
      },
    ],
  };
  const avatarAnimatedStyle = {
    transform: [
      {
        scale: avatarPulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.03],
        }),
      },
    ],
  };

  const onPressIn = () => {
    Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();
  };

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

      const uname = username.trim();
      const fname = fullName.trim();
      let avatar_key: string | undefined; // storage key we’ll store in DB

      if (avatar) {
        // 1) Upload avatar to a dedicated bucket
        const { data: u } = await supabase.auth.getUser();
        const userId = u.user?.id;
        if (!userId) throw new Error("No user");

        const key = `avatars/${userId}/${Date.now()}.jpg`;

        // RN-friendly upload (no fetch().blob())
        const file = {
          uri: avatar,
          name: "avatar.jpg",
          type: "image/jpeg",
        } as any;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(key, file, { upsert: true });
        if (upErr) throw upErr;

        avatar_key = key;
      }

      // 2) Update Supabase Auth metadata (what shows in the Auth “Display name” column)
      await supabase.auth.updateUser({
        data: {
          full_name: fname || uname, // Supabase UI usually reads this
          display_name: uname, // extra aliases don’t hurt
          username: uname,
          avatar_url: avatar_key ?? null,
        },
      });
      // (optional) await supabase.auth.refreshSession();

      // 3) Upsert your public.profiles row via your FastAPI
      await save({
        username: uname,
        full_name: fname || undefined,
        avatar_url: avatar_key, // store the STORAGE KEY, not a full URL
      });

      // 4) Done
      navigation.replace("Home");
    } catch (e) {
      console.log(e); // TODO: show a toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        // small offset so iOS doesn’t over-shift; adjust if you add a header
        keyboardVerticalOffset={insets.top}
      >
        {/* Background bubbles */}
        <Animated.View
          pointerEvents="none"
          style={[styles.blobA, blob1Style]}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.blobB, blob2Style]}
        />

        {/* Make content scrollable when keyboard is open */}
        <ScrollView
          contentContainerStyle={[
            styles.inner,
            { paddingBottom: insets.bottom + 24 }, // ensure button clears keyboard/safe-area
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: heroOpacity,
                transform: [{ translateY: heroTranslate }],
              },
            ]}
          >
            <Text style={styles.title}>Set up your profile</Text>
            <Text style={styles.sub}>Pick a username and photo</Text>
          </Animated.View>

          {/* Content */}
          <Animated.View
            style={{
              opacity: formOpacity,
              transform: [{ translateY: formTranslate }],
            }}
          >
            <Animated.View style={[styles.avatarWrap, avatarAnimatedStyle]}>
              <TouchableOpacity
                onPress={pickImage}
                activeOpacity={0.88}
                style={styles.avatarBox}
              >
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                  <Text style={styles.avatarText}>Add Photo</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="yourname"
                placeholderTextColor={COLORS.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, uFocused && styles.inputFocused]}
                onFocus={() => setUFocused(true)}
                onBlur={() => setUFocused(false)}
                returnKeyType="next"
              />
              {!!handlePreview && (
                <Text style={styles.helper}>{handlePreview}</Text>
              )}
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Full name (optional)</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your Name"
                placeholderTextColor={COLORS.placeholder}
                autoCapitalize="words"
                style={[styles.input, nFocused && styles.inputFocused]}
                onFocus={() => setNFocused(true)}
                onBlur={() => setNFocused(false)}
                returnKeyType="done"
              />
            </View>

            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                onPress={onSave}
                disabled={!valid || loading}
                activeOpacity={0.9}
                style={[styles.cta, (!valid || loading) && styles.ctaDisabled]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.ctaText}>Continue</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, backgroundColor: COLORS.bg },

  inner: {
    paddingHorizontal: 24,
    paddingTop: 56,
  },

  // Bubbles (light)
  blobA: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#dbeafe",
    opacity: 0.45,
    top: -70,
    right: -70,
  },
  blobB: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#bfdbfe",
    opacity: 0.35,
    bottom: -60,
    left: -60,
  },

  header: { marginBottom: 20 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: "800" },
  sub: { color: COLORS.subtext, fontSize: 14 },

  avatarWrap: { alignItems: "center", marginTop: 12, marginBottom: 20 },
  avatarBox: {
    height: 128,
    width: 128,
    borderRadius: 64,
    backgroundColor: "#eef3ff",
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  avatarText: { color: COLORS.placeholder, fontWeight: "600" },
  avatar: { height: 128, width: 128, borderRadius: 64 },

  fieldBlock: { marginBottom: 14 },
  label: { color: COLORS.subtext, fontSize: 14, marginBottom: 8 },

  input: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "500",
    letterSpacing: 0.3,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  inputFocused: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  helper: { marginTop: 6, color: COLORS.placeholder, fontSize: 12 },

  cta: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    marginTop: 18,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
