import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import Screens/Pages
import Login from './src/screens/Login';
import MainMenu from './src/screens/MainMenu';
import Jobsites from './src/screens/jobSites';
import Payorders from './src/screens/Payorders';
import Warehouses from './src/screens/Warehouses';
import WarehouseDeliveries from './src/screens/WarehouseDeliveries';

// Type definitions for TypeScript
export type RootStackParamList = {
  Login: undefined;
  MainMenu: undefined;
  Jobsites: undefined;
  Payorders: undefined;
  Warehouses: undefined;
  WarehouseDeliveries: { warehouseId: string };
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
        <Stack.Screen name="Warehouses" component={Warehouses} />
        <Stack.Screen name="WarehouseDeliveries" component={WarehouseDeliveries} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}