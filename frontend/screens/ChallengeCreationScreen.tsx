import React, { useState, useEffect } from "react";
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
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SocialPost } from "../services/socialData";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { IconButton } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../providers/AuthProvider";
import { createPost, directUpload, updatePostMedia, getUserChallenges } from "../lib/api";

type Props = NativeStackScreenProps<RootStackParamList, "ChallengeCreation">;

type Mode = "new" | "update";

export default function ChallengeCreationScreen({ navigation }: Props) {
  const { accessToken } = useAuth();
  const [activeMode, setActiveMode] = useState<Mode>("new");
  const [selectedChallengeId, setSelectedChallengeId] = useState<number | null>(
    null
  );
  // Track user created challenges
  const [userChallenges, setUserChallenges] = useState<
    Array<{ id: number; title: string }>
  >([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);

  // Load user challenges from backend
  useEffect(() => {
    const loadUserChallenges = async () => {
      if (!accessToken) return;

      try {
        setLoadingChallenges(true);
        const challenges = await getUserChallenges(accessToken);
        // Map to simple format for UI
        setUserChallenges(
          challenges.map((c) => ({ id: c.id, title: c.title }))
        );
      } catch (error) {
        console.error("Error loading challenges:", error);
        // Fallback to AsyncStorage
        try {
          const storedChallenges = await AsyncStorage.getItem("userChallenges");
          if (storedChallenges) {
            setUserChallenges(JSON.parse(storedChallenges));
          }
        } catch (e) {
          console.error("Error loading from AsyncStorage:", e);
        }
      } finally {
        setLoadingChallenges(false);
      }
    };
    loadUserChallenges();
  }, [accessToken]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const commit = "5"; // Fixed commit amount
  const [expiryDays, setExpiryDays] = useState("7");
  const [expiryHours, setExpiryHours] = useState("0");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleCreateChallenge = async () => {
    if (!accessToken) {
      Alert.alert(
        "Authentication Error",
        "Please log in to create challenges."
      );
      return;
    }

    if (activeMode === "update") {
      if (!selectedChallengeId) {
        Alert.alert(
          "Missing Selection",
          "Please select a challenge to update."
        );
        return;
      }
      if (!description.trim()) {
        Alert.alert("Missing Information", "Please add an update description.");
        return;
      }
    } else if (!title.trim()) {
      Alert.alert("Missing Information", "Please add a challenge title.");
      return;
    }

    if (!selectedImage) {
      Alert.alert("Missing Photo", "Please take a photo.");
      return;
    }

    try {
      setLoading(true);

      if (activeMode === "new") {
        // Create a new challenge with post
        const parsedDays = parseInt(expiryDays, 10);
        const parsedHours = parseInt(expiryHours, 10);
        const totalHours =
          (isNaN(parsedDays) ? 7 : parsedDays) * 24 +
          (isNaN(parsedHours) ? 0 : parsedHours);

        // Calculate end date
        const endsAt = new Date(
          Date.now() + totalHours * 60 * 60 * 1000
        ).toISOString();

        // Create post with new challenge (without media first)
        const post = await createPost(accessToken, {
          new_challenge: {
            title: title.trim(),
            description: description.trim() || undefined,
            amount_cents: 500, // $5 = 500 cents
            ends_at: endsAt,
          },
          caption: title.trim(),
        });

        console.log("Created post:", post);

        // Refresh challenges list
        try {
          const challenges = await getUserChallenges(accessToken);
          setUserChallenges(
            challenges.map((c) => ({ id: c.id, title: c.title }))
          );
        } catch (err) {
          console.error("Error refreshing challenges:", err);
          // Add to local list as fallback
          setUserChallenges([
            ...userChallenges,
            { id: post.challenge_id, title: title.trim() },
          ]);
        }

        // Get file extension and content type from image URI
        const fileExt = selectedImage.split(".").pop()?.toLowerCase() || "jpg";
        const contentType = fileExt === "png" ? "image/png" : "image/jpeg";

        // Direct upload via backend (bypasses Storage RLS)
        const direct = await directUpload(accessToken, post.id, selectedImage, contentType);

        // Update post with media URL
        await updatePostMedia(accessToken, post.id, direct.path);

        console.log("Updated post with media URL");

        Alert.alert("Success", "Challenge created successfully!");
        navigation.navigate("Home" as any, {} as any);
      } else {
        // Handle challenge update (post to existing challenge)
        if (!selectedChallengeId) return;

        // Create post under existing challenge
        const post = await createPost(accessToken, {
          challenge_id: selectedChallengeId,
          caption: description.trim(),
        });

        console.log("Created update post:", post);

        // Get file extension and content type from image URI
        const fileExt = selectedImage.split(".").pop()?.toLowerCase() || "jpg";
        const contentType = fileExt === "png" ? "image/png" : "image/jpeg";

        // Direct upload via backend (bypasses Storage RLS)
        const direct = await directUpload(accessToken, post.id, selectedImage, contentType);

        // Update post with media URL
        await updatePostMedia(accessToken, post.id, direct.path);

        console.log("Updated post with media URL");

        Alert.alert("Success", "Update posted successfully!");

        // Clear form
        setDescription("");
        setSelectedImage(null);
        navigation.navigate("Home" as any, {} as any);
      }
    } catch (error: any) {
      console.error("Error creating challenge/update:", error);
      Alert.alert(
        "Error",
        error.message ||
          (activeMode === "new"
            ? "Failed to create challenge. Please try again."
            : "Failed to post update. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Camera permission is required to take photos."
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false, // capture full image
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open camera. Please try again.");
    }
  };

  const handleSelectImage = async () => {
    try {
      // Request media library permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Photo library permission is required to select images."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Challenge</Text>
        <TouchableOpacity
          onPress={handleCreateChallenge}
          disabled={!title.trim() || !selectedImage || loading}
          style={[
            styles.createButton,
            (!title.trim() || !selectedImage || loading) &&
              styles.createButtonDisabled,
          ]}
        >
          <Text style={styles.createButtonText}>
            {activeMode === "new" ? "Create" : "Post Update"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mode Selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeTab, activeMode === "new" && styles.modeTabActive]}
          onPress={() => setActiveMode("new")}
        >
          <Text
            style={[
              styles.modeTabText,
              activeMode === "new" && styles.modeTabTextActive,
            ]}
          >
            Create
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeTab,
            activeMode === "update" && styles.modeTabActive,
          ]}
          onPress={() => setActiveMode("update")}
        >
          <Text
            style={[
              styles.modeTabText,
              activeMode === "update" && styles.modeTabTextActive,
            ]}
          >
            Update
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Photo Section */}
            <View style={styles.photoSection}>
              <Text style={styles.sectionTitle}>Proof Photo</Text>
              {selectedImage ? (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.selectedImage}
                  />
                  <TouchableOpacity
                    style={styles.changeImageButton}
                    onPress={handleSelectImage}
                  >
                    <Text style={styles.changeImageText}>Retake</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoOptions}>
                  <TouchableOpacity
                    style={[
                      styles.photoButton,
                      { flex: undefined, width: "100%" },
                    ]}
                    onPress={handleTakePhoto}
                  >
                    <IconButton
                      icon="camera"
                      size={32}
                      iconColor="#6B8AFF"
                      style={styles.cameraIcon}
                    />
                    <Text style={styles.photoButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {activeMode === "new" ? (
              /* New Challenge Form */
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Challenge Details</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Challenge Title</Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g., Will I go to the gym 5 days this week?"
                    placeholderTextColor="#6b7280"
                    style={styles.input}
                    maxLength={100}
                  />
                  <Text style={styles.characterCount}>{title.length}/100</Text>
                </View>

                {/* Description input is only needed when posting updates; hide for new challenge */}
              </View>
            ) : (
              /* Update Challenge Form */
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Your Challenges</Text>
                {loadingChallenges ? (
                  <Text style={styles.loadingText}>Loading challenges...</Text>
                ) : userChallenges.length === 0 ? (
                  <Text style={styles.emptyText}>
                    No challenges yet. Create one first!
                  </Text>
                ) : (
                  <ScrollView style={styles.challengeList}>
                    {userChallenges.map((challenge) => (
                      <TouchableOpacity
                        key={challenge.id}
                        style={[
                          styles.challengeItem,
                          selectedChallengeId === challenge.id &&
                            styles.challengeItemSelected,
                        ]}
                        onPress={() => {
                          setSelectedChallengeId(challenge.id);
                          setTitle(challenge.title);
                          setDescription("");
                        }}
                      >
                        <View style={styles.challengeItemContent}>
                          <Text style={styles.challengeItemTitle}>
                            {challenge.title}
                          </Text>
                          {selectedChallengeId === challenge.id && (
                            <IconButton
                              icon="check-circle"
                              size={24}
                              iconColor="#6B8AFF"
                              style={styles.selectedIcon}
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {title && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Update Details</Text>
                    <TextInput
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Share your progress update..."
                      placeholderTextColor="#6b7280"
                      style={[styles.input, styles.textArea]}
                      multiline
                      numberOfLines={4}
                      maxLength={500}
                    />
                    <Text style={styles.characterCount}>
                      {description.length}/500
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Settings - Only show for new challenges */}
            {activeMode === "new" && (
              <View style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>Challenge Settings</Text>

                <View style={styles.settingCard}>
                  <View style={styles.settingHeader}>
                    <Text style={styles.settingLabel}>Commit Amount</Text>
                    <Text style={styles.settingDescription}>
                      Fixed amount for all participants
                    </Text>
                  </View>
                  <View style={styles.settingInput}>
                    <Text style={styles.currencySymbol}>$5</Text>
                  </View>
                </View>

                <View style={styles.settingCard}>
                  <View style={styles.settingHeader}>
                    <Text style={styles.settingLabel}>Expires In</Text>
                    <Text style={styles.settingDescription}>
                      How long the challenge lasts
                    </Text>
                  </View>
                  <View style={styles.settingInput}>
                    <TextInput
                      value={expiryDays}
                      onChangeText={setExpiryDays}
                      keyboardType="numeric"
                      style={styles.expiryInput}
                      maxLength={2}
                    />
                    <Text style={styles.unitText}>days</Text>
                    <TextInput
                      value={expiryHours}
                      onChangeText={setExpiryHours}
                      keyboardType="numeric"
                      style={[styles.expiryInput, { marginLeft: 8 }]}
                      maxLength={2}
                    />
                    <Text style={styles.unitText}>hours</Text>
                  </View>
                </View>
              </View>
            )}

            {/* End of Settings */}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E5ED",
  },
  cancelButton: {
    color: "#9CA3AF",
    fontSize: 16,
    fontWeight: "500",
  },
  headerTitle: {
    color: "#1A1D2E",
    fontSize: 18,
    fontWeight: "600",
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#6B8AFF",
    borderRadius: 12,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  photoSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#1A1D2E",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  photoOptions: {
    flexDirection: "row",
    gap: 12,
  },
  photoButton: {
    flex: 1,
    height: 120,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E5ED",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIcon: {
    margin: 0,
  },
  photoButtonText: {
    color: "#6B8AFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  photoHelperText: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  imageContainer: {
    position: "relative",
  },
  selectedImage: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 12,
    resizeMode: "cover",
  },
  changeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  changeImageText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: "#1A1D2E",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E5ED",
    color: "#1A1D2E",
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  characterCount: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E5ED",
  },
  settingHeader: {
    marginBottom: 12,
  },
  settingLabel: {
    color: "#1A1D2E",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  settingDescription: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  settingInput: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    color: "#1A1D2E",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  stakeInput: {
    width: 60,
    height: 36,
    backgroundColor: "#F8FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6B8AFF",
    color: "#1A1D2E",
    fontSize: 14,
    textAlign: "center",
  },
  expiryInput: {
    width: 50,
    height: 36,
    backgroundColor: "#F8FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6B8AFF",
    color: "#1A1D2E",
    fontSize: 14,
    textAlign: "center",
  },
  unitText: {
    color: "#9CA3AF",
    fontSize: 12,
    marginLeft: 8,
  },
  existingChallengeTitle: {
    fontSize: 16,
    color: "#1A1D2E",
    fontWeight: "600",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F8FAFB",
    borderRadius: 12,
  },
  modeSelector: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E5ED",
  },
  modeTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  modeTabActive: {
    borderBottomColor: "#6B8AFF",
  },
  modeTabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  modeTabTextActive: {
    color: "#6B8AFF",
    fontWeight: "600",
  },
  challengeList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  challengeItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E5ED",
  },
  challengeItemTitle: {
    fontSize: 16,
    color: "#1A1D2E",
    fontWeight: "600",
    flex: 1,
  },
  challengeItemSelected: {
    backgroundColor: "#F8FAFB",
    borderColor: "#6B8AFF",
  },
  challengeItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedIcon: {
    margin: 0,
  },
  loadingText: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
});
