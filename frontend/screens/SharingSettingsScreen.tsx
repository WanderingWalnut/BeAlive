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
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />
      
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
    backgroundColor: '#F8FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E9EE',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF2FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  optionSelected: {
    borderColor: '#6B46FF',
    backgroundColor: '#F5F3FF',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionDescription: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E6E9EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#6B46FF',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6B46FF',
  },
  inviteSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEF2FF',
  },
  inviteTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  inviteDescription: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  inviteButton: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E9EE',
  },
  inviteButtonText: {
    color: '#6B46FF',
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: '#EEF2FF',
    backgroundColor: '#FFFFFF',
  },
  continueButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B46FF',
    marginBottom: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footerText: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
  },
});
