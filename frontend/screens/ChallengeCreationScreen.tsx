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

type Props = NativeStackScreenProps<RootStackParamList, 'ChallengeCreation'>;

export default function ChallengeCreationScreen({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stake, setStake] = useState('10');
  const [expiryDays, setExpiryDays] = useState('7');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleCreateChallenge = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing Information', 'Please fill in both title and description.');
      return;
    }

    try {
      setLoading(true);
      
      // In a real app, create challenge in backend
      Alert.alert(
        'Challenge Created!',
        'Your challenge has been shared with your friends.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to create challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = () => {
    Alert.alert('Take Photo', 'Camera functionality coming soon!');
  };

  const handleSelectImage = () => {
    Alert.alert('Select Image', 'Image picker functionality coming soon!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Challenge</Text>
        <TouchableOpacity
          onPress={handleCreateChallenge}
          disabled={!title.trim() || !description.trim() || loading}
          style={[styles.createButton, (!title.trim() || !description.trim() || loading) && styles.createButtonDisabled]}
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
                <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                  <IconButton
                    icon="camera"
                    size={32}
                    iconColor="#4f46e5"
                    style={styles.cameraIcon}
                  />
                  <Text style={styles.photoButtonText}>Take Photo</Text>
                  <Text style={styles.photoHelperText}>
                    Add a photo to prove your challenge
                  </Text>
                </TouchableOpacity>
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
                  <Text style={styles.settingDescription}>
                    How much each person commits
                  </Text>
                </View>
                <View style={styles.settingInput}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    value={stake}
                    onChangeText={setStake}
                    keyboardType="numeric"
                    style={styles.stakeInput}
                    maxLength={3}
                  />
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
                </View>
              </View>
            </View>

            {/* Preview */}
            <View style={styles.previewSection}>
              <Text style={styles.sectionTitle}>Preview</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <View style={styles.previewUserInfo}>
                    <View style={styles.previewAvatar} />
                    <View>
                      <Text style={styles.previewUsername}>You</Text>
                      <Text style={styles.previewHandle}>@you</Text>
                    </View>
                  </View>
                  <Text style={styles.previewTime}>now</Text>
                </View>
                
                <Text style={styles.previewTitle}>{title || 'Your challenge title...'}</Text>
                {description && (
                  <Text style={styles.previewDescription}>
                    {description}
                  </Text>
                )}
                
                <View style={styles.previewStats}>
                  <View style={styles.previewStat}>
                    <Text style={styles.previewStatLabel}>Stake</Text>
                    <Text style={styles.previewStatValue}>${stake}</Text>
                  </View>
                  <View style={styles.previewStat}>
                    <Text style={styles.previewStatLabel}>Expires</Text>
                    <Text style={styles.previewStatValue}>{expiryDays} days</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  cancelButton: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4f46e5',
    borderRadius: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#fff',
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
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  photoButton: {
    height: 120,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#374151',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    margin: 0,
  },
  photoButtonText: {
    color: '#4f46e5',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  photoHelperText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  imageContainer: {
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    resizeMode: 'cover',
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
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#374151',
    color: '#fff',
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  characterCount: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  settingHeader: {
    marginBottom: 12,
  },
  settingLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#9ca3af',
    fontSize: 12,
  },
  settingInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  stakeInput: {
    width: 60,
    height: 36,
    backgroundColor: '#000',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4f46e5',
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  expiryInput: {
    width: 50,
    height: 36,
    backgroundColor: '#000',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4f46e5',
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  unitText: {
    color: '#9ca3af',
    fontSize: 12,
    marginLeft: 8,
  },
  previewSection: {
    marginBottom: 32,
  },
  previewCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4f46e5',
    marginRight: 8,
  },
  previewUsername: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  previewHandle: {
    color: '#9ca3af',
    fontSize: 12,
  },
  previewTime: {
    color: '#6b7280',
    fontSize: 12,
  },
  previewTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 20,
  },
  previewDescription: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 12,
  },
  previewStats: {
    flexDirection: 'row',
    gap: 16,
  },
  previewStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewStatLabel: {
    color: '#6b7280',
    fontSize: 12,
    marginRight: 4,
  },
  previewStatValue: {
    color: '#4f46e5',
    fontSize: 12,
    fontWeight: '600',
  },
});