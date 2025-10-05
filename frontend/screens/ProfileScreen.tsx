import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Card, Button } from 'react-native-paper';
import BottomNavigation from '../components/BottomNavigation';
import FloatingButton from '../components/FloatingButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const [index, setIndex] = useState(2); // Start with settings tab active

  const handleTabPress = (key: string) => {
    if (key === 'home') {
      navigation.replace('Home');
    } else if (key === 'commitments') {
      navigation.replace('Commitments');
    }
  };

  const user = {
    id: 'dev-user',
    username: 'DevUser',
    handle: '@devuser',
    profilePicture: 'https://i.pravatar.cc/150?u=devuser',
    posts: 12,
    following: 150,
    followers: 300,
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Edit profile feature coming soon!');
  };

  const handleEditContacts = () => {
    navigation.navigate('Contacts', { phone: 'mock-phone', username: user.username });
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
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


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />

      {/* Custom Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <Image source={{ uri: user.profilePicture }} style={styles.profilePicture} />
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.handle}>{user.handle}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.posts}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={handleEditProfile}
              style={styles.actionButton}
              labelStyle={styles.actionButtonLabel}
            >
              Edit Profile
            </Button>
            <Button
              mode="outlined"
              onPress={handleEditContacts}
              style={styles.actionButton}
              labelStyle={styles.actionButtonLabel}
            >
              Edit Contacts
            </Button>
          </View>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="text"
              onPress={handleLogout}
              icon="logout"
              labelStyle={styles.logoutButtonLabel}
              contentStyle={styles.logoutButtonContent}
            >
              Logout
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Floating + Button - Always Visible */}
      <FloatingButton />

      {/* Bottom Navigation */}
      <BottomNavigation 
        currentIndex={index}
        onTabPress={handleTabPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E5ED',
  },
  headerTitle: {
    color: '#1A1D2E',
    fontSize: 20,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E5ED',
    marginBottom: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#6B8AFF',
  },
  username: {
    color: '#1A1D2E',
    fontSize: 22,
    fontWeight: '700',
  },
  handle: {
    color: '#9CA3AF',
    fontSize: 15,
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#1A1D2E',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    paddingHorizontal: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
  },
  logoutButtonLabel: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  logoutButtonContent: {
    justifyContent: 'flex-start',
    paddingLeft: 0,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  activeNavItem: {
    backgroundColor: 'transparent',
  },
  navIcon: {
    margin: 0,
    width: 24,
    height: 24,
  },
  navText: {
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 2,
  },
  activeNavText: {
    color: '#4f46e5',
  },
});
