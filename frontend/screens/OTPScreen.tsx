import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Easing,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { supabase } from "../lib/supabase";
import { getMe } from "../lib/api";

type Props = NativeStackScreenProps<RootStackParamList, "OTP">;

export default function OTPScreen({ route, navigation }: Props) {
  const { phone } = route.params;
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const isValid = useMemo(() => /^\d{6}$/.test(code), [code]);

  // Animations
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslate = useRef(new Animated.Value(12)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslate = useRef(new Animated.Value(16)).current;

  const btnScale = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;

  const blob1 = useRef(new Animated.Value(0)).current;
  const blob2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Autofocus – do twice for reliability across platforms
    const t1 = setTimeout(() => inputRef.current?.focus(), 0);
    const t2 = setTimeout(() => inputRef.current?.focus(), 250);

    // Entrance animations
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

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [heroOpacity, heroTranslate, formOpacity, formTranslate, blob1, blob2]);

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

  const onPressIn = () => {
    Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();
  };

  const triggerShake = () => {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, {
        toValue: 1,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: -1,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 1,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onVerify = async () => {
    if (!isValid) {
      setErr("Enter the 6-digit code.");
      triggerShake();
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: "sms",
      });
      if (error) throw error;
      // Decide next screen based on profile completeness
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        // Debug logs
        // eslint-disable-next-line no-console
        console.log("EXPO_PUBLIC_API_URL:", process.env.EXPO_PUBLIC_API_URL);
        // eslint-disable-next-line no-console
        console.log("token prefix:", token?.slice(0, 12));

        let next: "Home" | "ProfileSetup" = "ProfileSetup";
        if (token) {
          const profile = await getMe(token);
          const needsSetup =
            !profile || !profile.username || !profile.avatar_url;
          next = needsSetup ? "ProfileSetup" : "Home";
        }
        navigation.reset({ index: 0, routes: [{ name: next }] });
      } catch {
        // Any failure → ProfileSetup (safer default for first-time users)
        navigation.reset({ index: 0, routes: [{ name: "ProfileSetup" }] });
      }
    } catch (e: any) {
      setErr(e?.message ?? "Invalid or expired code.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Bubbles */}
        <Animated.View
          pointerEvents="none"
          style={[styles.blobA, blob1Style]}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.blobB, blob2Style]}
        />

        <View style={styles.inner}>
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
            <Text style={styles.title}>Verify your phone</Text>
            <Text style={styles.sub}>We texted a code to {phone}</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            style={{
              opacity: formOpacity,
              transform: [{ translateY: formTranslate }],
            }}
          >
            <Text style={styles.label}>6-digit code</Text>

            <Animated.View
              style={{
                transform: [
                  {
                    translateX: shake.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [-8, 8],
                    }),
                  },
                ],
              }}
            >
              <TextInput
                ref={inputRef}
                autoFocus
                blurOnSubmit={false}
                value={code}
                onChangeText={(t) => {
                  setCode(t.replace(/\D/g, ""));
                  if (err) setErr(null);
                }}
                placeholder="• • • • • •"
                placeholderTextColor={COLORS.placeholder}
                keyboardType="number-pad"
                maxLength={6}
                style={[styles.input, !!err && styles.inputError]}
              />
            </Animated.View>

            {err ? (
              <Text style={styles.error}>{err}</Text>
            ) : (
              <View style={{ height: 8 }} />
            )}

            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                onPress={onVerify}
                disabled={!isValid || loading}
                activeOpacity={0.9}
                style={[
                  styles.cta,
                  (!isValid || loading) && styles.ctaDisabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={styles.ctaText}>Continue</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginTop: 12 }}
            >
              <Text style={styles.editLink}>Wrong number? Edit</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const COLORS = {
  bg: "#f7f7fb",
  text: "#0f172a",
  subtext: "#475569",
  border: "#e5e7eb",
  placeholder: "#9aa3af",
  error: "#ef4444",
  primary: "#2563eb",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, backgroundColor: COLORS.bg },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 64 },

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

  header: { gap: 6, marginBottom: 18 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: "800" },
  sub: { color: COLORS.subtext, fontSize: 14 },

  label: { color: COLORS.subtext, fontSize: 14, marginBottom: 8 },

  input: {
    height: 60,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    letterSpacing: 10,
    fontSize: 24,
    textAlign: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  inputError: { borderColor: COLORS.error },

  error: { color: COLORS.error, marginTop: 8 },

  cta: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    marginTop: 16,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  editLink: { color: COLORS.placeholder, textAlign: "center" },
});
