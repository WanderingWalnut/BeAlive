import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { theme } from './theme';
import { BetsProvider } from './contexts/BetsContext';

import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import OTPScreen from './screens/OTPScreen';
import UsernameScreen from './screens/UsernameScreen';
import ContactsScreen from './screens/ContactsScreen';
import SharingSettingsScreen from './screens/SharingSettingsScreen';
import HomeScreen from './screens/HomeScreen';
import ChallengeCreationScreen from './screens/ChallengeCreationScreen';
import CommitmentsScreen from './screens/CommitmentsScreen';
import ProfileScreen from './screens/ProfileScreen';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  OTP: {
    phone: string;
    isSignup?: boolean;
    firstName?: string;
    lastName?: string;
  };
  Username: {
    phone: string;
  };
  Contacts: {
    phone: string;
    username: string;
  };
  SharingSettings: {
    phone: string;
    username: string;
    selectedContacts?: any[];
  };
  Home: {
    user?: {
      id: string;
      phone_number: string;
      first_name: string;
      last_name: string;
      created_at: string;
    };
    newChallenge?: {
      title: string;
      description: string;
      stake: number;
      expiryDays: number;
      image: string;
    };
  };
  ChallengeCreation: undefined;
  Commitments: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <BetsProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="Splash" 
            screenOptions={{ 
              headerShown: false,
              animation: 'none',
              animationTypeForReplace: 'push',
              gestureEnabled: false,
            }}
          >
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
            <Stack.Screen name="Username" component={UsernameScreen} />
            <Stack.Screen name="Contacts" component={ContactsScreen} />
            <Stack.Screen name="SharingSettings" component={SharingSettingsScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="ChallengeCreation" component={ChallengeCreationScreen} />
            <Stack.Screen name="Commitments" component={CommitmentsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </BetsProvider>
  );
}
