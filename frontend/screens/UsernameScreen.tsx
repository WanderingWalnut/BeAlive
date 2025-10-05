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
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Username'>;

export default function UsernameScreen({ navigation, route }: Props) {
  const { phone } = route.params;
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidUsername = username.trim().length >= 3 && /^[a-zA-Z0-9_]+$/.test(username.trim());

  const handleContinue = async () => {
    if (!isValidUsername) {
      Alert.alert('Invalid Username', 'Username must be at least 3 characters and contain only letters, numbers, and underscores.');
      return;
    }

    try {
      setLoading(true);
      
      // In a real app, save username to backend
      // For now, just navigate to contacts screen
      navigation.navigate('Contacts', { 
        phone,
        username: username.trim()
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Your Profile</Text>
            <Text style={styles.subtitle}>
              Choose a username that your friends will see
            </Text>
          </View>

          {/* Profile Picture Placeholder */}
          <View style={styles.profileSection}>
            <View style={styles.profilePicture}>
              <Text style={styles.profilePictureText}>
                {username.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <TouchableOpacity style={styles.changePictureButton}>
              <Text style={styles.changePictureText}>Add Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Username Input */}
          <View style={styles.form}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              placeholderTextColor="#9aa3af"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, isValidUsername && styles.inputValid]}
              maxLength={20}
            />
            <Text style={styles.helperText}>
              3-20 characters, letters, numbers, and underscores only
            </Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!isValidUsername || loading}
            style={[styles.continueButton, (!isValidUsername || loading) && styles.continueButtonDisabled]}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Your username will be visible to friends
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  inner: { 
    flex: 1, 
    paddingHorizontal: 24, 
    paddingTop: 72, 
    paddingBottom: 24, 
    justifyContent: 'space-between' 
  },

  header: { alignItems: 'center', marginBottom: 40 },
  title: { 
    fontSize: 32, 
    fontWeight: '800', 
    color: '#fff', 
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#a3a3a3',
    textAlign: 'center',
    lineHeight: 22,
  },

  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profilePictureText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  changePictureButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  changePictureText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },

  form: { marginBottom: 32 },
  label: { 
    color: '#e5e7eb', 
    fontSize: 16, 
    fontWeight: '600',
    marginBottom: 8 
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
    marginBottom: 8,
  },
  inputValid: {
    borderColor: '#10b981',
  },
  helperText: {
    color: '#9ca3af',
    fontSize: 12,
  },

  continueButton: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    marginBottom: 20,
  },
  continueButtonDisabled: { 
    opacity: 0.6 
  },
  continueButtonText: { 
    color: '#fff', 
    fontSize: 17, 
    fontWeight: '700' 
  },

  footer: { alignItems: 'center' },
  footerText: { 
    color: '#6b7280', 
    fontSize: 12, 
    textAlign: 'center' 
  },
});
