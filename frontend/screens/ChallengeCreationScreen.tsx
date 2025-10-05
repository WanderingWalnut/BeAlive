import React, { useState } from 'react';
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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

type Props = NativeStackScreenProps<RootStackParamList, 'ChallengeCreation'>;

export default function ChallengeCreationScreen({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const stake = '5'; // Fixed stake amount
  const [expiryDays, setExpiryDays] = useState('7');
  const [expiryHours, setExpiryHours] = useState('0');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleCreateChallenge = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Information', 'Please add a challenge title.');
      return;
    }

    if (!selectedImage) {
      Alert.alert('Missing Photo', 'Please take a photo to prove your challenge.');
      return;
    }

    try {
      setLoading(true);
      
      // Navigate back to Home with the new challenge data
      navigation.navigate('Home', {
        newChallenge: {
          title: title.trim(),
          description: description.trim(),
          stake: 5, // Fixed stake amount
          expiryDays: parseInt(expiryDays) || 7,
          expiryHours: parseInt(expiryHours) || 0,
          image: selectedImage,
        },
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to create challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Camera permission is required to take photos.'
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const handleSelectImage = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Photo library permission is required to select images.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image. Please try again.');
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
        <Text style={styles.headerTitle}>Create Challenge</Text>
        <TouchableOpacity
          onPress={handleCreateChallenge}
          disabled={!title.trim() || !selectedImage || loading}
          style={[styles.createButton, (!title.trim() || !selectedImage || loading) && styles.createButtonDisabled]}
        >
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Photo Section */}
            <View style={styles.photoSection}>
              <Text style={styles.sectionTitle}>Proof Photo</Text>
              {selectedImage ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                  <TouchableOpacity style={styles.changeImageButton} onPress={handleSelectImage}>
                    <Text style={styles.changeImageText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoOptions}>
                  <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                    <IconButton
                      icon="camera"
                      size={32}
                      iconColor="#6B8AFF"
                      style={styles.cameraIcon}
                    />
                    <Text style={styles.photoButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoButton} onPress={handleSelectImage}>
                    <IconButton
                      icon="image"
                      size={32}
                      iconColor="#6B8AFF"
                      style={styles.cameraIcon}
                    />
                    <Text style={styles.photoButtonText}>Choose Photo</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Challenge Details */}
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

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add more details about your challenge..."
                  placeholderTextColor="#6b7280"
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
                <Text style={styles.characterCount}>{description.length}/500</Text>
              </View>
            </View>

            {/* Settings */}
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>Challenge Settings</Text>
              
              <View style={styles.settingCard}>
                <View style={styles.settingHeader}>
                  <Text style={styles.settingLabel}>Stake Amount</Text>
                  <Text style={styles.settingDescription}>Fixed amount for all commitments</Text>
                </View>
                <View style={styles.settingInput}>
                  <Text style={styles.currencySymbol}>$5</Text>
                </View>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingHeader}>
                  <Text style={styles.settingLabel}>Expires In</Text>
                  <Text style={styles.settingDescription}>How long the challenge lasts</Text>
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
    backgroundColor: '#F8FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E5ED',
  },
  cancelButton: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#1A1D2E',
    fontSize: 18,
    fontWeight: '600',
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#6B8AFF',
    borderRadius: 12,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
    color: '#1A1D2E',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  photoOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E5ED',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    margin: 0,
  },
  photoButtonText: {
    color: '#6B8AFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  photoHelperText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  imageContainer: {
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    aspectRatio: 3/4,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  changeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  changeImageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#1A1D2E',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E5ED',
    color: '#1A1D2E',
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  characterCount: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E5ED',
  },
  settingHeader: {
    marginBottom: 12,
  },
  settingLabel: {
    color: '#1A1D2E',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  settingInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    color: '#1A1D2E',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  stakeInput: {
    width: 60,
    height: 36,
    backgroundColor: '#F8FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6B8AFF',
    color: '#1A1D2E',
    fontSize: 14,
    textAlign: 'center',
  },
  expiryInput: {
    width: 50,
    height: 36,
    backgroundColor: '#F8FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6B8AFF',
    color: '#1A1D2E',
    fontSize: 14,
    textAlign: 'center',
  },
  unitText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginLeft: 8,
  },

});