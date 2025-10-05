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
import { Card, Button, IconButton } from 'react-native-paper';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const [index, setIndex] = useState(3); // Start with settings tab active
  const [routes] = useState([
    { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'commitments', title: 'Bets', focusedIcon: 'chart-line', unfocusedIcon: 'chart-line' },
    { key: 'create', title: 'Create', focusedIcon: 'plus', unfocusedIcon: 'plus' },
    { key: 'settings', title: 'Settings', focusedIcon: 'cog', unfocusedIcon: 'cog-outline' },
  ]);

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

  const handleTabPress = (key: string) => {
    if (key === 'home') {
      navigation.navigate('Home');
    } else if (key === 'commitments') {
      navigation.navigate('Commitments');
    } else if (key === 'create') {
      navigation.navigate('ChallengeCreation');
    }
    // Settings tab stays on current screen
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

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

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, index === 0 && styles.activeNavItem]}
          onPress={() => handleTabPress('home')}
        >
          <IconButton
            icon={index === 0 ? 'home' : 'home-outline'}
            size={24}
            iconColor={index === 0 ? '#4f46e5' : '#9ca3af'}
            style={styles.navIcon}
          />
          <Text style={[styles.navText, index === 0 && styles.activeNavText]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, index === 1 && styles.activeNavItem]}
          onPress={() => handleTabPress('commitments')}
        >
          <IconButton
            icon={index === 1 ? 'chart-line' : 'chart-line'}
            size={24}
            iconColor={index === 1 ? '#4f46e5' : '#9ca3af'}
            style={styles.navIcon}
          />
          <Text style={[styles.navText, index === 1 && styles.activeNavText]}>Bets</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, index === 2 && styles.activeNavItem]}
          onPress={() => handleTabPress('create')}
        >
          <IconButton
            icon={index === 2 ? 'plus' : 'plus'}
            size={24}
            iconColor={index === 2 ? '#4f46e5' : '#9ca3af'}
            style={styles.navIcon}
          />
          <Text style={[styles.navText, index === 2 && styles.activeNavText]}>Create</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, index === 3 && styles.activeNavItem]}
          onPress={() => handleTabPress('settings')}
        >
          <IconButton
            icon={index === 3 ? 'cog' : 'cog-outline'}
            size={24}
            iconColor={index === 3 ? '#4f46e5' : '#9ca3af'}
            style={styles.navIcon}
          />
          <Text style={[styles.navText, index === 3 && styles.activeNavText]}>Settings</Text>
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
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    marginBottom: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  username: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  handle: {
    color: '#9ca3af',
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
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: '#9ca3af',
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
    borderRadius: 8,
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: '#141419',
    borderRadius: 12,
    marginBottom: 20,
  },
  logoutButtonLabel: {
    color: '#ef4444',
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
