import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from './src/context/AuthContext';

import Login                from './src/screens/Login';
import MainMenu             from './src/screens/MainMenu';
import Jobsites             from './src/screens/jobSites';
import JobsiteInventory     from './src/screens/JobsiteInventory';
import Payorders            from './src/screens/Payorders';
import PayorderInventory    from './src/screens/PayorderInventory';
import Warehouses           from './src/screens/Warehouses';
import WarehouseDeliveries  from './src/screens/WarehouseDeliveries';
import DeliveryInventory    from './src/screens/DeliveryInventory';

// Screens reachable once authenticated.
export type RootStackParamList = {
  MainMenu:            undefined;
  Jobsites:            undefined;
  JobsiteInventory:    { jobsiteId: string; jobsiteName: string; jobsiteAddress: string };
  Payorders:           undefined;
  PayorderInventory:   { payorderId: string; payorderNumber: string; jobsiteAddress: string; fulfillmentStatus: string };
  Warehouses:          undefined;
  WarehouseDeliveries: { warehouseId: string; warehouseName: string; warehouseAddress: string };
  DeliveryInventory:   { warehouseId: string; deliveryId: string; packingSlipId: string; jobsiteId: string; jobsiteName: string; jobsiteAddress: string };
};

type AuthStackParamList = { Login: undefined };

const MainStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function RootNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!token) {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={Login} />
      </AuthStack.Navigator>
    );
  }

  return (
    <MainStack.Navigator initialRouteName="MainMenu" screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="MainMenu"            component={MainMenu} />
      <MainStack.Screen name="Jobsites"            component={Jobsites} />
      <MainStack.Screen name="JobsiteInventory"    component={JobsiteInventory} />
      <MainStack.Screen name="Payorders"           component={Payorders} />
      <MainStack.Screen name="PayorderInventory"   component={PayorderInventory} />
      <MainStack.Screen name="Warehouses"          component={Warehouses} />
      <MainStack.Screen name="WarehouseDeliveries" component={WarehouseDeliveries} />
      <MainStack.Screen name="DeliveryInventory"   component={DeliveryInventory} />
    </MainStack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
