import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider } from "./providers/AuthProvider";

import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/ProfileSetup";
import HomeScreen from "./screens/HomeScreen";
import OTPScreen from "./screens/OTPScreen"; // <-- make sure this import exists
import ProfileSetup from "./screens/ProfileSetup";

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  OTP: { phone: string };
  Home: undefined;
  ProfileSetup: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="OTP" component={OTPScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="ProfileSetup" component={ProfileSetup} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
