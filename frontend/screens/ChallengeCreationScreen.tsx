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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import Icon from '../components/Icon';

type Props = NativeStackScreenProps<RootStackParamList, 'ChallengeCreation'>;

export default function ChallengeCreationScreen({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stake, setStake] = useState('5');
  const [expiryDays, setExpiryDays] = useState('7');
  const [loading, setLoading] = useState(false);

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
              <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                <Icon name="camera" size={24} color="#4f46e5" />
                <Text style={styles.photoButtonText}>Take Photo</Text>
                <Text style={styles.photoHelperText}>
                  Add a photo to prove your challenge
                </Text>
              </TouchableOpacity>
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
                  placeholderTextColor="#9aa3af"
                  style={styles.input}
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add more details about your challenge..."
                  placeholderTextColor="#9aa3af"
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
              </View>
            </View>

            {/* Settings */}
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>Challenge Settings</Text>
              
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
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

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
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
                <Text style={styles.previewTitle}>{title || 'Your challenge title...'}</Text>
                <Text style={styles.previewDescription}>
                  {description || 'Challenge description...'}
                </Text>
                <View style={styles.previewStats}>
                  <Text style={styles.previewStat}>Stake: ${stake}</Text>
                  <Text style={styles.previewStat}>Expires: {expiryDays} days</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  cancelButton: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
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
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  photoSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  photoButton: {
    height: 120,
    backgroundColor: '#141419',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#374151',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonText: {
    color: '#4f46e5',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  photoHelperText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  formSection: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: '#141419',
    borderWidth: 1,
    borderColor: '#262635',
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  settingsSection: {
    marginBottom: 32,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#9ca3af',
    fontSize: 14,
  },
  settingInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 4,
  },
  stakeInput: {
    width: 60,
    height: 40,
    backgroundColor: '#141419',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#262635',
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  expiryInput: {
    width: 50,
    height: 40,
    backgroundColor: '#141419',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#262635',
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  unitText: {
    color: '#9ca3af',
    fontSize: 14,
    marginLeft: 8,
  },
  previewSection: {
    marginBottom: 40,
  },
  previewCard: {
    backgroundColor: '#141419',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#262635',
  },
  previewTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  previewDescription: {
    color: '#a3a3a3',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  previewStats: {
    flexDirection: 'row',
    gap: 16,
  },
  previewStat: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
});
