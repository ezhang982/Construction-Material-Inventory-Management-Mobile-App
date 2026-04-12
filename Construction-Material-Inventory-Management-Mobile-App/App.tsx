import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Jobsites from './src/screens/jobSites';
import Payorders from './src/screens/Payorders';

// Import Screens/Pages
import Login from './src/screens/Login';
import MainMenu from './src/screens/MainMenu';

// Type definitions for TypeScript
export type RootStackParamList = {
  Login: undefined;
  MainMenu: undefined;
  Jobsites: undefined;
  Payorders: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      {/* screenOptions={{ headerShown: false }} hides the default top header bar */}
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="MainMenu" component={MainMenu} />
        <Stack.Screen name="Jobsites" component={Jobsites} />
        <Stack.Screen name="Payorders" component={Payorders} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}