import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { supabase } from "../lib/supabase";
import { getMe } from "../lib/api";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

const COLORS = {
  bg: "#f9fafb",
  text: "#0f172a",
  subtext: "#475569",
  primary: "#2563eb",
};

export default function SplashScreen({ navigation }: Props) {
  // Light, floaty bubbles like Login
  const blob1 = useRef(new Animated.Value(0)).current;
  const blob2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const float = (val: Animated.Value, dur: number, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 1,
            duration: dur,
            delay,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: dur,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();

    float(blob1, 6000);
    float(blob2, 7200, 400);
  }, [blob1, blob2]);

  const blob1Style = {
    transform: [
      {
        translateY: blob1.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -15],
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
          outputRange: [0, -8],
        }),
      },
    ],
  };

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const minDelay = new Promise((r) => setTimeout(r, 3000)); // short splash

      try {
        // 1) Check session first. If not logged in -> Login.
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          await minDelay;
          if (!cancelled) navigation.replace("Login");
          return;
        }

        // 2) We are logged in -> check onboarding status.
        //    If onboarded -> Home, else -> ProfileSetup.
        const { data: userData, error: userErr } =
          await supabase.auth.getUser();
        if (userErr || !userData?.user) {
          await minDelay;
          if (!cancelled) navigation.replace("Login");
          return;
        }

        // optional: use helper above; or inline query as below.
        const uid = userData.user.id;
        const flagged = Boolean(
          (userData.user.user_metadata as any)?.onboarded
        );

        let onboarded = flagged;
        if (!onboarded) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("user_id", uid)
            .single();
          onboarded = Boolean(profile?.username && profile?.avatar_url);
        }

        await minDelay;
        if (!cancelled) {
          navigation.reset({
            index: 0,
            routes: [{ name: onboarded ? "Home" : "ProfileSetup" }],
          });
        }
      } catch {
        await minDelay;
        if (!cancelled) navigation.replace("Login");
      }
    };

    boot();
    return () => {
      cancelled = true;
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Bubbles to match Login */}
      <Animated.View pointerEvents="none" style={[styles.blobA, blob1Style]} />
      <Animated.View pointerEvents="none" style={[styles.blobB, blob2Style]} />

      {/* Brand */}
      <View style={styles.center}>
        <Text style={styles.logo}>BeAlive.</Text>
        <Text style={styles.tagline}>Support friends' goals — together</Text>

        <View style={{ height: 18 }} />
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingText}>Preparing your experience…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { alignItems: "center", paddingHorizontal: 24 },
  logo: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  tagline: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.subtext,
    textAlign: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.subtext,
  },
  blobA: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#dbeafe",
    opacity: 0.5,
    top: -70,
    right: -70,
  },
  blobB: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#bfdbfe",
    opacity: 0.4,
    bottom: -60,
    left: -60,
  },
});
