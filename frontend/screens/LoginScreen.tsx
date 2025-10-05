import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView,
  StatusBar,
  Animated,
  Easing,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabase";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

const CANADA_PREFIX = "+1";

export default function LoginScreen({ navigation }: Props) {
  const [localDigits, setLocalDigits] = useState("");
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const digits = localDigits.replace(/\D/g, "").slice(0, 10);
  const isValid = digits.length === 10;

  // Animations
  const blob1 = useRef(new Animated.Value(0)).current;
  const blob2 = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    inputRef.current?.focus();

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
      { translateY: blob1.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) },
      { translateX: blob1.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }) },
    ],
  };
  const blob2Style = {
    transform: [
      { translateY: blob2.interpolate({ inputRange: [0, 1], outputRange: [0, 12] }) },
      { translateX: blob2.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
    ],
  };

  const onPressIn = () => {
    Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleChange = (v: string) => {
    setLocalDigits(v);
    if (error) setError(null);
  };

  const onSendCode = async () => {
    if (!isValid) {
      setError("Enter a valid 10-digit Canadian number.");
      return;
    }

    try {
      setLoading(true);
      const phone = `${CANADA_PREFIX}${digits}`;
      const { error: sbError } = await supabase.auth.signInWithOtp({
        phone,
        options: { channel: "sms", shouldCreateUser: true },
      });
      if (sbError) throw sbError;
      navigation.navigate("OTP", { phone });
    } catch (e: any) {
      setError(e?.message ?? "Could not send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            {/* Animated bubbles */}
            <Animated.View style={[styles.blobA, blob1Style]} />
            <Animated.View style={[styles.blobB, blob2Style]} />

            {/* (DEV skip removed) */}

            {/* Title section */}
            <View style={styles.header}>
              <Text style={styles.logo}>BeAlive.</Text>
              <Text style={styles.prompt}>What's your phone number?</Text>
            </View>

            {/* Input row */}
            <View style={[styles.inputRow, focused && styles.inputFocused]}>
              <View style={styles.prefixPill}>
                <Text style={styles.flag}>🇨🇦</Text>
                <Text style={styles.prefix}>{CANADA_PREFIX}</Text>
              </View>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={localDigits}
                onChangeText={handleChange}
                placeholder="555 555 5555"
                keyboardType="number-pad"
                returnKeyType="done"
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                maxLength={14}
              />
            </View>

            {/* Link */}
            <Text style={styles.linkText}>Recently changed your phone number?</Text>

            {/* Button */}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={[styles.cta, (!isValid || loading) && styles.ctaDisabled]}
                onPress={onSendCode}
                disabled={!isValid || loading}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.ctaText}>Send Verification Text</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Footer */}
            <Text style={styles.footer}>
              By continuing, you agree to our{" "}
              <Text style={styles.link}>Privacy Policy</Text> and{" "}
              <Text style={styles.link}>Terms of Service</Text>.
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const COLORS = {
  bg: "#f9fafb",
  text: "#0f172a",
  subtext: "#475569",
  border: "#e2e8f0",
  primary: "#2563eb",
  error: "#ef4444",
  placeholder: "#9ca3af",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, backgroundColor: COLORS.bg },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 26,
  },

  header: { marginBottom: 36 },
  logo: { fontSize: 34, fontWeight: "800", color: COLORS.text },
  prompt: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 10,
    color: COLORS.text,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 10,
    height: 60,
    marginBottom: 14,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  prefixPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5ff",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 10,
  },
  flag: { fontSize: 16, marginRight: 6 },
  prefix: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  input: {
    flex: 1,
    fontSize: 18,
    color: COLORS.text,
    paddingVertical: 10,
  },

  linkText: {
    fontSize: 14,
    color: COLORS.subtext,
    textDecorationLine: "underline",
    marginBottom: 16,
  },

  error: { color: COLORS.error, marginBottom: 8 },

  cta: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    marginBottom: 20,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 17 },

  footer: {
    color: COLORS.subtext,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  link: { textDecorationLine: "underline", color: COLORS.subtext },

  // (Removed) dev skip styles

  // bubbles
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
