import React, { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, StyleSheet
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { supabase } from "../lib/supabase";

type Props = NativeStackScreenProps<RootStackParamList, "OTP">;

export default function OTPScreen({ route, navigation }: Props) {
  const { phone } = route.params;
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isValid = useMemo(() => /^\d{6}$/.test(code), [code]);

  const onVerify = async () => {
    if (!isValid) {
      setErr("Enter the 6-digit code.");
      return;
    }
    try {
      setLoading(true);

      // Supabase: verify OTP
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: "sms",
      });

      if (error) throw error;

      // Session is now active; you can read it or just continue
      // const { data: sessionData } = await supabase.auth.getSession();

      // If this is the user's first time, you could branch to profile setup.
      // For now, go straight to Home:
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (e: any) {
      setErr(e?.message ?? "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.title}>Verify your phone</Text>
          <Text style={styles.sub}>We texted a code to {phone}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>6-digit code</Text>
          <TextInput
            value={code}
            onChangeText={(t) => { setCode(t.replace(/\D/g, "")); if (err) setErr(null); }}
            placeholder="______"
            placeholderTextColor="#9aa3af"
            keyboardType="number-pad"
            maxLength={6}
            style={[styles.input, !!err && styles.inputError]}
          />
          {err ? <Text style={styles.error}>{err}</Text> : null}

          <TouchableOpacity
            onPress={onVerify}
            disabled={!isValid || loading}
            style={[styles.cta, (!isValid || loading) && styles.ctaDisabled]}
            activeOpacity={0.9}
          >
            {loading ? <ActivityIndicator /> : <Text style={styles.ctaText}>Continue</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
            <Text style={{ color: "#9aa3af", textAlign: "center" }}>Wrong number? Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0e" },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 72 },
  header: { gap: 6, marginBottom: 16 },
  title: { color: "#fff", fontSize: 28, fontWeight: "800" },
  sub: { color: "#a3a3a3" },
  form: { gap: 10 },
  label: { color: "#e5e7eb", fontSize: 14 },
  input: {
    height: 56, borderRadius: 14, paddingHorizontal: 16,
    backgroundColor: "#141419", borderWidth: 1, borderColor: "#262635",
    color: "#fff", letterSpacing: 6, fontSize: 22, textAlign: "center"
  },
  inputError: { borderColor: "#ef4444" },
  error: { color: "#ef4444" },
  cta: {
    height: 54, borderRadius: 14, alignItems: "center",
    justifyContent: "center", backgroundColor: "#4f46e5", marginTop: 6
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
