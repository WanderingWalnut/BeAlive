import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // simple E.164-ish check: allows + and 10-15 digits
  const isValid = useMemo(() => /^\+?\d{10,15}$/.test(phone.replace(/\s/g, "")), [phone]);

  const onChange = (v: string) => {
    setPhone(v);
    if (error) setError(null);
  };

  const onSendCode = async () => {
    if (!isValid) {
      setError("Enter a valid phone number (e.g., +15555555555).");
      return;
    }
    try {
      setLoading(true);
      // TODO: call your OTP provider (Firebase, Supabase, Twilio, etc.)
      // await sendOtp(phone);

      // Navigate to OTP screen with the phone value
      navigation.navigate("OTP", { phone: phone.replace(/\s/g, "") });
    } catch (e) {
      setError("Could not send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          {/* Brand / Copy */}
          <View style={styles.header}>
            <Text style={styles.appName}>BeAlive</Text>
            <Text style={styles.tagline}>Bet on everyday life — with friends.</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Phone number</Text>
            <TextInput
              value={phone}
              onChangeText={onChange}
              placeholder="+1 555 555 5555"
              placeholderTextColor="#9aa3af"
              keyboardType="phone-pad"
              returnKeyType="done"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="telephoneNumber"
              style={[styles.input, !!error && styles.inputError]}
              maxLength={18} // room for spaces; regex strips them
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              onPress={onSendCode}
              disabled={!isValid || loading}
              style={[styles.cta, (!isValid || loading) && styles.ctaDisabled]}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.ctaText}>Send code</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.helper}>
              We’ll text you a 6-digit code to verify your number.
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms & Privacy.
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0e" },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 72, paddingBottom: 24, justifyContent: "space-between" },

  header: { gap: 8 },
  appName: { fontSize: 40, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  tagline: { fontSize: 16, color: "#a3a3a3" },

  form: { gap: 12 },
  label: { color: "#e5e7eb", fontSize: 14, marginBottom: 4 },
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
  inputError: { borderColor: "#ef4444" },
  errorText: { color: "#ef4444", marginTop: -4, marginBottom: 4 },

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

  helper: { color: "#9aa3af", textAlign: "center", marginTop: 8 },

  footer: { alignItems: "center" },
  footerText: { color: "#6b7280", fontSize: 12, textAlign: "center" },
});
