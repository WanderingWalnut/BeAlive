import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      // Check if user is logged in (in real app, check stored auth token)
      // For now, always go to login
      navigation.replace('Login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* App Logo/Title */}
      <View style={styles.logoContainer}>
        <Text style={styles.appName}>BeAlive</Text>
        <Text style={styles.tagline}>Bet on everyday life — with friends</Text>
      </View>

      {/* Loading Indicator */}
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  appName: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 18,
    color: '#a3a3a3',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 16,
  },
});
