import React, { useMemo, useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Text, TextInput, Button, Card } from "react-native-paper";
import { RootStackParamList } from "../App";
import { supabase } from "../lib/supabase";

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
      const normalized = phone.replace(/\s/g, "");

      // Supabase: send SMS; creates user if they don’t exist
      const { error: sbError } = await supabase.auth.signInWithOtp({
        phone: normalized,
        options: {
          channel: 'sms',
          shouldCreateUser: true, // treat login/signup the same — first time creates
        },
      });

      if (sbError) throw sbError;

      navigation.navigate("OTP", { phone: normalized });
    } catch (e: any) {
      setError(e?.message ?? "Could not send code. Please try again.");
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
              <Card style={styles.formCard}>
                <Card.Content>
                  <TextInput
                    label="Phone number"
                    value={phone}
                    onChangeText={onChange}
                    placeholder="+1 555 555 5555"
                    keyboardType="phone-pad"
                    returnKeyType="done"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="telephoneNumber"
                    mode="outlined"
                    error={!!error}
                    maxLength={18}
                    style={styles.input}
                  />
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <Button
                    mode="contained"
                    onPress={onSendCode}
                    disabled={!isValid || loading}
                    loading={loading}
                    style={styles.cta}
                    contentStyle={styles.ctaContent}
                  >
                    Send code
                  </Button>

                  <Text style={styles.helper}>
                    We'll text you a 6-digit code to verify your number.
                  </Text>
                </Card.Content>
              </Card>

          {/* Skip to Home (Development) */}
          <View style={styles.skipContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Home', { 
                user: {
                  id: 'dev-user',
                  phone_number: '+1234567890',
                  first_name: 'Dev',
                  last_name: 'User',
                  created_at: new Date().toISOString()
                }
              })}
              style={styles.skipButton}
              icon="rocket-launch"
            >
              Skip to Home
            </Button>
            <Text style={styles.skipHelper}>Quick access for development</Text>
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

  formCard: {
    backgroundColor: "#141419",
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  errorText: { 
    color: "#ef4444", 
    marginTop: -8, 
    marginBottom: 8,
    fontSize: 12,
  },
  cta: {
    marginTop: 8,
  },
  ctaContent: {
    paddingVertical: 8,
  },

  helper: { color: "#9aa3af", textAlign: "center", marginTop: 8 },

  skipContainer: { 
    alignItems: "center", 
    marginTop: 24,
    paddingVertical: 16,
  },
  skipButton: {
    marginBottom: 8,
  },
  skipHelper: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },

  footer: { alignItems: "center" },
  footerText: { color: "#6b7280", fontSize: 12, textAlign: "center" },
});
