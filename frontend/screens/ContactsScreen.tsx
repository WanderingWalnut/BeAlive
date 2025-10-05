import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import Icon from "../components/Icon";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";

type Contact = {
  id: string;
  name: string;
  phone: string;
  selected: boolean;
};

type Props = NativeStackScreenProps<RootStackParamList, "Contacts">;

export default function ContactsScreen({ navigation, route }: Props) {
  const { phone, username } = route.params;
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  // Load contacts from device (expo-contacts) and preload saved selections
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        // Dynamic import to avoid static native module issues during type-check
        const ContactsModule: any = await import("expo-contacts");

        // Request permissions
        const { status } = await ContactsModule.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Contacts Permission",
            "Permission to access contacts was denied. You can still select contacts manually."
          );
          // Try loading any previously saved selections
          const saved = await AsyncStorage.getItem("selectedContacts");
          const parsed = saved ? JSON.parse(saved) : [];
          if (mounted) {
            setContacts(
              parsed.map((c: any, idx: number) => ({
                id: `${idx}-${c.phone}`,
                name: c.name,
                phone: c.phone,
                selected: true,
              }))
            );
            setLoading(false);
          }
          return;
        }

        // Fetch all contacts with phone numbers
        const { data } = await ContactsModule.getContactsAsync({
          fields: [ContactsModule.Fields.PhoneNumbers],
          pageSize: 10000,
        });

        // Load previously saved selected contacts by phone to pre-select
        const savedRaw = await AsyncStorage.getItem("selectedContacts");
        const saved = savedRaw ? JSON.parse(savedRaw) : [];
        const savedPhones = new Set(
          saved.map((s: any) => normalizePhone(s.phone))
        );

        const mapped: Contact[] = (data || [])
          .map((c: any) => {
            const phone =
              c.phoneNumbers && c.phoneNumbers.length > 0
                ? c.phoneNumbers[0].number
                : undefined;
            const name =
              c.name ||
              [c.firstName, c.lastName].filter(Boolean).join(" ") ||
              phone ||
              "Unknown";
            if (!phone) return null;
            return {
              id: c.id,
              name,
              phone,
              selected: savedPhones.has(normalizePhone(phone)),
            } as Contact;
          })
          .filter(Boolean) as Contact[];

        if (mounted) {
          setContacts(mapped);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading contacts:", err);
        Alert.alert(
          "Error",
          "Could not load device contacts. Using saved selections if available."
        );
        const saved = await AsyncStorage.getItem("selectedContacts");
        const parsed = saved ? JSON.parse(saved) : [];
        if (mounted) {
          setContacts(
            parsed.map((c: any, idx: number) => ({
              id: `${idx}-${c.phone}`,
              name: c.name,
              phone: c.phone,
              selected: true,
            }))
          );
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Normalize phone numbers for matching (strip non-digits, keep leading + if present)
  const normalizePhone = (p?: string) => {
    if (!p) return "";
    return p.replace(/[^0-9+]/g, "").replace(/^\+?0+/, "+");
  };

  const toggleContact = (id: string) => {
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === id
          ? { ...contact, selected: !contact.selected }
          : contact
      )
    );
  };

  const selectAll = () => {
    setContacts((prev) =>
      prev.map((contact) => ({ ...contact, selected: true }))
    );
  };

  const deselectAll = () => {
    setContacts((prev) =>
      prev.map((contact) => ({ ...contact, selected: false }))
    );
  };

  const handleContinue = async () => {
    const selected = contacts.filter((c) => c.selected);

    // Keep your local cache
    await AsyncStorage.setItem(
      "selectedContacts",
      JSON.stringify(selected.map((c) => ({ name: c.name, phone: c.phone })))
    );

    // Build payload for backend
    const emails: string[] = []; // fill if you collect emails
    const phones: string[] = selected.map((c) => c.phone);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        Alert.alert("Not logged in", "Please log in again.");
        return;
      }

      // 1) Import contacts -> get matches
      const importRes = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/network/import-contacts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ emails, phones }),
        }
      );

      if (!importRes.ok) {
        const txt = await importRes.text();
        throw new Error(txt || "Import failed");
      }

      const importData = await importRes.json(); // ImportContactsResponse
      const matches: Array<{ user_id: string }> = importData?.matches ?? [];

      // 2) Follow each matched user (idempotent)
      let followed = 0;
      for (const m of matches) {
        try {
          const r = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/network/follow`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ target_user_id: m.user_id }),
            }
          );
          if (r.ok) followed += 1;
        } catch (_) {
          // ignore individual failures
        }
      }

      Alert.alert(
        "Contacts Imported",
        `Followed ${followed} friend${followed === 1 ? "" : "s"}.`
      );

      // Go back to Home; feed will now include friends’ posts
      navigation.navigate("Home", {
        user: {
          id: "new-user",
          phone_number: phone,
          first_name: username,
          last_name: "",
          created_at: new Date().toISOString(),
        },
      });
    } catch (e: any) {
      console.error("import-contacts + follow failed", e);
      Alert.alert("Error", e.message || "Could not import contacts.");
    }
  };

  const selectedCount = contacts.filter((contact) => contact.selected).length;

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={[styles.contactItem, item.selected && styles.contactItemSelected]}
      onPress={() => toggleContact(item.id)}
    >
      <View style={styles.contactInfo}>
        <View style={styles.contactAvatar}>
          <Text style={styles.contactAvatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.contactDetails}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactPhone}>{item.phone}</Text>
        </View>
      </View>
      <View style={[styles.checkbox, item.selected && styles.checkboxSelected]}>
        {item.selected && <Icon name="check" size={14} color="#fff" />}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />

      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginBottom: 8 }}
        >
          <Text style={{ color: "#6B8AFF" }}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Import Contacts</Text>
        <Text style={styles.subtitle}>
          Select friends you want to share challenges with
        </Text>
      </View>

      {/* Selection Controls */}
      <View style={styles.selectionControls}>
        <TouchableOpacity style={styles.controlButton} onPress={selectAll}>
          <Text style={styles.controlButtonText}>Select All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={deselectAll}>
          <Text style={styles.controlButtonText}>Deselect All</Text>
        </TouchableOpacity>
      </View>

      {/* Contacts List */}
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContact}
        style={styles.contactsList}
        showsVerticalScrollIndicator={false}
      />

      {/* Continue Button */}
      <View style={styles.footer}>
        <Text style={styles.selectedCount}>
          {selectedCount} contact{selectedCount !== 1 ? "s" : ""} selected
        </Text>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFB",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFB",
  },
  loadingText: {
    color: "#9ca3af",
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E6E9EE",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1D2E",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  selectionControls: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    justifyContent: "flex-end",
    gap: 12,
  },
  controlButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E6E9EE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  controlButtonText: {
    color: "#6B46FF",
    fontSize: 14,
    fontWeight: "600",
  },
  contactsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E6E9EE",
  },
  contactItemSelected: {
    borderColor: "#6B46FF",
    backgroundColor: "#F5F3FF",
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contactAvatarText: {
    color: "#6B46FF",
    fontSize: 16,
    fontWeight: "700",
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  contactPhone: {
    color: "#6B7280",
    fontSize: 13,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E6E9EE",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxSelected: {
    backgroundColor: "#6B46FF",
    borderColor: "#6B46FF",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: "#EEF2FF",
    backgroundColor: "#FFFFFF",
  },
  selectedCount: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  continueButton: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6B46FF",
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
