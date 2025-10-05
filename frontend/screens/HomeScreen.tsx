import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  FlatList,
  StatusBar,
  Image,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomNavigation, IconButton } from 'react-native-paper';
import { RootStackParamList } from '../App';
import { SocialPost, mockSocialPosts } from '../services/socialData';
import SocialPostComponent from '../components/SocialPost';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation, route }: Props) {
  const { user } = route.params || {};
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'create', title: 'Create', focusedIcon: 'plus', unfocusedIcon: 'plus' },
    { key: 'profile', title: 'Profile', focusedIcon: 'account', unfocusedIcon: 'account-outline' },
  ]);

  const handleUpvote = (postId: string) => {
    Alert.alert('Upvote', `Upvoted post ${postId}`);
  };

  const handleDownvote = (postId: string) => {
    Alert.alert('Downvote', `Downvoted post ${postId}`);
  };

  const renderScene = BottomNavigation.SceneMap({
    home: () => (
      <View style={styles.scene}>
        <FlatList
          data={mockSocialPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SocialPostComponent
              {...item}
              onUpvote={() => handleUpvote(item.id)}
              onDownvote={() => handleDownvote(item.id)}
            />
          )}
          contentContainerStyle={styles.feedContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    ),
    create: () => (
      <View style={styles.scene}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Create post coming soon!</Text>
        </View>
      </View>
    ),
    profile: () => (
      <View style={styles.scene}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Profile coming soon!</Text>
        </View>
      </View>
    ),
  });

  const handleTabPress = (key: string) => {
    if (key === 'profile') {
      navigation.navigate('Profile');
    } else if (key === 'create') {
      navigation.navigate('ChallengeCreation');
    }
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

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No user data available</Text>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <BottomNavigation
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        renderScene={renderScene}
        onTabPress={({ route }) => handleTabPress(route.key)}
        style={styles.bottomNav}
        barStyle={styles.bottomNavBar}
        activeColor="#4f46e5"
        inactiveColor="#9ca3af"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scene: {
    flex: 1,
    backgroundColor: '#000',
  },
  feedContainer: {
    paddingBottom: 0,
  },
  bottomNav: {
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    height: 60,
  },
  bottomNavBar: {
    backgroundColor: '#000',
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 20,
    textAlign: 'center',
  },
});
