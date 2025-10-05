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
  const [posts, setPosts] = useState<SocialPost[]>(mockSocialPosts);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'commitments', title: 'Bets', focusedIcon: 'chart-line', unfocusedIcon: 'chart-line' },
    { key: 'create', title: 'Create', focusedIcon: 'plus', unfocusedIcon: 'plus' },
    { key: 'settings', title: 'Settings', focusedIcon: 'cog', unfocusedIcon: 'cog-outline' },
  ]);

  const handleCommit = (postId: string, choice: 'yes' | 'no') => {
    const post = posts.find(p => p.id === postId);
    const choiceText = choice === 'yes' ? 'YES (investing in their success)' : 'NO (betting against their success)';
    
    Alert.alert(
      'Place Your Bet',
      `Are you sure you want to bet ${choiceText}? This choice cannot be changed and you'll commit $${post?.stake || 0} to the prize pool.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Place Bet', 
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


  const renderScene = BottomNavigation.SceneMap({
    home: () => (
      <View style={styles.scene}>
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
        {/* Floating + Button */}
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => navigation.navigate('ChallengeCreation')}
        >
          <IconButton
            icon="plus"
            size={24}
            iconColor="#fff"
            style={styles.floatingButtonIcon}
          />
        </TouchableOpacity>
      </View>
    ),
    commitments: () => (
      <View style={styles.scene}>
        <FlatList
          data={posts.filter(p => p.userCommitment?.locked)}
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
      </View>
    ),
    create: () => (
      <View style={styles.scene}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Create challenge coming soon!</Text>
        </View>
      </View>
    ),
    settings: () => null, // This will be handled by navigation
  });

  const handleTabPress = (key: string) => {
    if (key === 'settings') {
      navigation.navigate('Profile');
    } else if (key === 'create') {
      navigation.navigate('ChallengeCreation');
    } else if (key === 'commitments') {
      navigation.navigate('Commitments');
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
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingButtonIcon: {
    margin: 0,
  },
});
