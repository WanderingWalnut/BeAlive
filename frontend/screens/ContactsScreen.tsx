import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import Icon from '../components/Icon';

type Contact = {
  id: string;
  name: string;
  phone: string;
  selected: boolean;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Contacts'>;

export default function ContactsScreen({ navigation, route }: Props) {
  const { phone, username } = route.params;
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock contacts data
  useEffect(() => {
    const mockContacts: Contact[] = [
      { id: '1', name: 'Alex Johnson', phone: '+1234567890', selected: true },
      { id: '2', name: 'Sarah Chen', phone: '+1234567891', selected: true },
      { id: '3', name: 'Mike Wilson', phone: '+1234567892', selected: true },
      { id: '4', name: 'Emma Davis', phone: '+1234567893', selected: false },
      { id: '5', name: 'David Brown', phone: '+1234567894', selected: true },
      { id: '6', name: 'Lisa Garcia', phone: '+1234567895', selected: false },
      { id: '7', name: 'Tom Anderson', phone: '+1234567896', selected: true },
      { id: '8', name: 'Mom', phone: '+1234567897', selected: false },
      { id: '9', name: 'Dad', phone: '+1234567898', selected: false },
      { id: '10', name: 'Boss', phone: '+1234567899', selected: false },
    ];

    setTimeout(() => {
      setContacts(mockContacts);
      setLoading(false);
    }, 1000);
  }, []);

  const toggleContact = (id: string) => {
    setContacts(prev => 
      prev.map(contact => 
        contact.id === id 
          ? { ...contact, selected: !contact.selected }
          : contact
      )
    );
  };

  const selectAll = () => {
    setContacts(prev => prev.map(contact => ({ ...contact, selected: true })));
  };

  const deselectAll = () => {
    setContacts(prev => prev.map(contact => ({ ...contact, selected: false })));
  };

  const handleContinue = () => {
    const selectedContacts = contacts.filter(contact => contact.selected);
    navigation.navigate('SharingSettings', { 
      phone, 
      username,
      selectedContacts 
    });
  };

  const selectedCount = contacts.filter(contact => contact.selected).length;

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
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 8 }}>
          <Text style={{ color: '#6B8AFF' }}>Back</Text>
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
          {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
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
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
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
  selectionControls: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  controlButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  controlButtonText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
  contactsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#141419',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#262635',
  },
  contactItemSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#1e1b4b',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactPhone: {
    color: '#9ca3af',
    fontSize: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6b7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  selectedCount: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  continueButton: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
