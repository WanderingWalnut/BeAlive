import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type Contact = {
  id: string;
  name: string;
  phone: string;
  selected: boolean;
};

type Props = NativeStackScreenProps<RootStackParamList, 'SharingSettings'>;

export default function SharingSettingsScreen({ navigation, route }: Props) {
  const { phone, username, selectedContacts } = route.params;
  const [sharingMode, setSharingMode] = useState<'all' | 'selected'>('selected');

  const handleContinue = () => {
    // Save sharing preferences
    // In a real app, save to backend
    navigation.navigate('Home', {
      user: {
        id: 'new-user',
        phone_number: phone,
        first_name: username,
        last_name: '',
        created_at: new Date().toISOString()
      }
    });
  };

  const handleInviteFriends = () => {
    Alert.alert(
      'Invite Friends',
      'Send SMS invites to your selected contacts?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Invites', 
          onPress: () => {
            // In a real app, send SMS invites
            Alert.alert('Success', 'Invites sent to your friends!');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Sharing Settings</Text>
        <Text style={styles.subtitle}>
          Choose who can see your challenges by default
        </Text>
      </View>

      {/* Sharing Options */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.option, sharingMode === 'all' && styles.optionSelected]}
          onPress={() => setSharingMode('all')}
        >
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>All Contacts</Text>
            <Text style={styles.optionDescription}>
              Share challenges with everyone in your contacts
            </Text>
          </View>
          <View style={[styles.radioButton, sharingMode === 'all' && styles.radioButtonSelected]}>
            {sharingMode === 'all' && <View style={styles.radioButtonInner} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, sharingMode === 'selected' && styles.optionSelected]}
          onPress={() => setSharingMode('selected')}
        >
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Selected Contacts Only</Text>
            <Text style={styles.optionDescription}>
              Share challenges only with contacts you selected ({selectedContacts?.length || 0} people)
            </Text>
          </View>
          <View style={[styles.radioButton, sharingMode === 'selected' && styles.radioButtonSelected]}>
            {sharingMode === 'selected' && <View style={styles.radioButtonInner} />}
          </View>
        </TouchableOpacity>
      </View>

      {/* Invite Friends Section */}
      <View style={styles.inviteSection}>
        <Text style={styles.inviteTitle}>Invite Your Friends</Text>
        <Text style={styles.inviteDescription}>
          Send SMS invites to your selected contacts to get them started
        </Text>
        <TouchableOpacity style={styles.inviteButton} onPress={handleInviteFriends}>
          <Text style={styles.inviteButtonText}>Send Invites</Text>
        </TouchableOpacity>
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Get Started</Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>
          You can change these settings anytime
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a3a3a3',
    lineHeight: 22,
  },
  optionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#141419',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#262635',
  },
  optionSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#1e1b4b',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 20,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6b7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#4f46e5',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4f46e5',
  },
  inviteSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  inviteTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  inviteDescription: {
    color: '#a3a3a3',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
  },
  inviteButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  inviteButtonText: {
    color: '#4f46e5',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  continueButton: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    marginBottom: 12,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  footerText: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
  },
});
