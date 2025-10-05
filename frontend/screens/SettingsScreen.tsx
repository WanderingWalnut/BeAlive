import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import Icon from '../components/Icon';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function SettingsScreen({ navigation }: Props) {
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const handleChangeNumber = () => {
    Alert.alert('Change Number', 'Feature coming soon!');
  };

  const handlePaymentMethod = () => {
    Alert.alert('Payment Method', 'Feature coming soon!');
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'Feature coming soon!');
  };

  const handleContactSettings = () => {
    Alert.alert('Contact Settings', 'Feature coming soon!');
  };

  const handleProfile = () => {
    Alert.alert('Edit Profile', 'Feature coming soon!');
  };

  const handleSecurity = () => {
    Alert.alert('Security', 'Feature coming soon!');
  };

  const SettingItem = ({ 
    iconName, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true 
  }: {
    iconName: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Icon name={iconName} size={20} color="#4f46e5" />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && <Icon name="arrow" size={18} color="#6b7280" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />
      
      {/* Note: header removed to keep pages minimal and match other screens */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <SettingItem
            iconName="user"
            title="Edit Profile"
            subtitle="Username, photo, bio"
            onPress={handleProfile}
          />
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingItem
            iconName="phone"
            title="Phone Number"
            subtitle="Change your number"
            onPress={handleChangeNumber}
          />
          <SettingItem
            iconName="lock"
            title="Security"
            subtitle="Password, 2FA, privacy"
            onPress={handleSecurity}
          />
        </View>

        {/* Social Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social</Text>
          <SettingItem
            iconName="contacts"
            title="Contact Settings"
            subtitle="Manage who can see your challenges"
            onPress={handleContactSettings}
          />
          <SettingItem
            iconName="bell"
            title="Notifications"
            subtitle="Push notifications, email"
            onPress={handleNotifications}
          />
        </View>

        {/* Payment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <SettingItem
            iconName="card"
            title="Payment Method"
            subtitle="Add or update payment info"
            onPress={handlePaymentMethod}
          />
          <SettingItem
            iconName="wallet"
            title="Wallet"
            subtitle="View balance and transactions"
            onPress={() => Alert.alert('Wallet', 'Feature coming soon!')}
          />
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <SettingItem
            iconName="info"
            title="About BeAlive"
            subtitle="Version 1.0.0"
            onPress={() => Alert.alert('About', 'BeAlive v1.0.0\nA friendly way to support friends and track progress.')}
          />
          <SettingItem
            iconName="support"
            title="Help"
            subtitle="Get help and report issues"
            onPress={() => Alert.alert('Help', 'Contact us at support@bealive.app')}
          />
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  backButton: {
    color: '#4f46e5',
    fontSize: 24,
    fontWeight: '300',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#141419',
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    color: '#9ca3af',
    fontSize: 14,
  },
  arrow: {
    color: '#6b7280',
    fontSize: 18,
    fontWeight: '300',
  },
  logoutButton: {
    height: 52,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
