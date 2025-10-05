import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  FlatList,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { SocialPost, mockSocialPosts } from '../services/socialData';
import SocialPostComponent from '../components/SocialPost';
import BottomNavigation from '../components/BottomNavigation';
import FloatingButton from '../components/FloatingButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation, route }: Props) {
  const { user: routeUser } = route.params || {};
  
  // Create a mock user if none provided (for navigation from other screens)
  const user = routeUser || {
    id: 'dev-user',
    phone_number: '+1234567890',
    first_name: 'Dev',
    last_name: 'User',
    created_at: new Date().toISOString(),
  };
  
  const [posts, setPosts] = useState<SocialPost[]>(mockSocialPosts);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'settings', title: 'Settings', focusedIcon: 'cog', unfocusedIcon: 'cog-outline' },
  ]);

  const handleCommit = (postId: string, choice: 'yes' | 'no') => {
    const post = posts.find(p => p.id === postId);
    const choiceText = choice === 'yes' ? 'YES (investing in their success)' : 'NO (betting against their success)';
    
    Alert.alert(
      'Make Your Investment',
      `Are you sure you want to invest ${choiceText}? This choice cannot be changed and you'll commit $${post?.stake || 0} to the prize pool.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Invest', 
          style: 'default',
          onPress: () => {
            setPosts(prevPosts =>
              prevPosts.map(post => {
                if (post.id === postId) {
                  return {
                    ...post,
                    userCommitment: {
                      choice,
                      locked: true,
                    },
                    poolYes: choice === 'yes' ? post.poolYes + post.stake : post.poolYes,
                    poolNo: choice === 'no' ? post.poolNo + post.stake : post.poolNo,
                    participantsYes: choice === 'yes' ? post.participantsYes + 1 : post.participantsYes,
                    participantsNo: choice === 'no' ? post.participantsNo + 1 : post.participantsNo,
                  };
                }
                return post;
              })
            );
          }
        }
      ]
    );
  };


  const handleTabPress = (key: string) => {
    if (key === 'commitments') {
      navigation.replace('Commitments');
    } else if (key === 'settings') {
      navigation.replace('Profile');
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
      
      {/* Main Content */}
      <View style={styles.mainContent}>
        {index === 0 && (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SocialPostComponent
                {...item}
                onUpvote={() => {}}
                onDownvote={() => {}}
                onCommit={(choice) => handleCommit(item.id, choice)}
              />
            )}
            contentContainerStyle={styles.feedContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

      </View>

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
    backgroundColor: '#000',
  },
  mainContent: {
    flex: 1,
  },
  scene: {
    flex: 1,
    backgroundColor: '#000',
  },
  feedContainer: {
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});