import React, { useState, useEffect } from 'react';
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
import { useBets } from '../contexts/BetsContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation, route }: Props) {
  const { user: routeUser, newChallenge } = route.params || {};
  const { addBet, hasBet } = useBets();
  
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

  // Handle new challenge creation
  useEffect(() => {
    if (newChallenge) {
      const newPost: SocialPost = {
        id: `challenge-${Date.now()}`,
        username: `${user.first_name} ${user.last_name}`,
        handle: `@${user.first_name.toLowerCase()}`,
        timestamp: 'Just now',
        content: newChallenge.title,
        image: newChallenge.image,
        upvotes: 0,
        downvotes: 0,
        stake: newChallenge.stake,
        poolYes: 0,
        poolNo: 0,
        participantsYes: 0,
        participantsNo: 0,
        expiry: new Date(Date.now() + newChallenge.expiryDays * 24 * 60 * 60 * 1000).toISOString(),
      };

      setPosts(prevPosts => [newPost, ...prevPosts]);
      
      // Clear the newChallenge from route params
      navigation.setParams({ newChallenge: undefined } as any);
      
      Alert.alert('Success!', 'Your challenge has been created and shared with friends.');
    }
  }, [newChallenge]);

  const handleCommit = (postId: string, choice: 'yes' | 'no') => {
    const post = posts.find(p => p.id === postId);
    
    if (!post || !post.stake) {
      return;
    }
    
    // Check if user already has a bet on this post
    if (hasBet(postId)) {
      Alert.alert('Already Bet', 'You have already placed a bet on this challenge.');
      return;
    }
    
    const choiceText = choice === 'yes' 
      ? 'YES - I believe they will complete this challenge' 
      : 'NO - I don\'t think they will complete this challenge';
    
    Alert.alert(
      'Confirm Your Bet',
      `${choiceText}\n\nStake: $${post.stake}\n\nThis bet will be added to "My Bets" and cannot be changed once confirmed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm Bet', 
          style: 'default',
          onPress: () => {
            // Update post in feed
            setPosts(prevPosts =>
              prevPosts.map(p => {
                if (p.id === postId) {
                  return {
                    ...p,
                    userCommitment: {
                      choice,
                      locked: true,
                    },
                    poolYes: choice === 'yes' ? (p.poolYes || 0) + (p.stake || 0) : (p.poolYes || 0),
                    poolNo: choice === 'no' ? (p.poolNo || 0) + (p.stake || 0) : (p.poolNo || 0),
                    participantsYes: choice === 'yes' ? (p.participantsYes || 0) + 1 : (p.participantsYes || 0),
                    participantsNo: choice === 'no' ? (p.participantsNo || 0) + 1 : (p.participantsNo || 0),
                  };
                }
                return p;
              })
            );
            
            // Add to My Bets
            const updatedPoolYes = choice === 'yes' ? (post.poolYes || 0) + post.stake : (post.poolYes || 0);
            const updatedPoolNo = choice === 'no' ? (post.poolNo || 0) + post.stake : (post.poolNo || 0);
            const totalPool = updatedPoolYes + updatedPoolNo;
            const userSidePool = choice === 'yes' ? updatedPoolYes : updatedPoolNo;
            const expectedPayout = userSidePool > 0 ? (post.stake / userSidePool) * totalPool : post.stake;
            
            addBet({
              id: `bet-${postId}-${Date.now()}`,
              postId: postId,
              challengeTitle: post.content,
              creator: {
                username: post.username,
                handle: post.handle,
                avatar: `https://i.pravatar.cc/150?u=${post.username}`,
              },
              userChoice: choice,
              stake: post.stake,
              poolYes: updatedPoolYes,
              poolNo: updatedPoolNo,
              participantsYes: choice === 'yes' ? (post.participantsYes || 0) + 1 : (post.participantsYes || 0),
              participantsNo: choice === 'no' ? (post.participantsNo || 0) + 1 : (post.participantsNo || 0),
              expectedPayout: Math.round(expectedPayout * 100) / 100,
              expiry: post.expiry || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              image: post.image,
              isExpired: false,
              updates: [],
            });
            
            // Show success message
            Alert.alert(
              'Bet Placed!',
              `Your bet has been added to "My Bets". You can view it in the Bets tab.`,
              [{ text: 'OK' }]
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
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />
      
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

      {/* Floating + Button - Only on Home Tab */}
      <FloatingButton show={index === 0} />

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
  mainContent: {
    flex: 1,
  },
  scene: {
    flex: 1,
    backgroundColor: '#F8FAFB',
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
    color: '#9CA3AF',
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
    color: '#FF6B6B',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#6B8AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});