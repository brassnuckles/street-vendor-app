import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// Import all screens
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { VendorDashboardScreen } from './screens/VendorDashboardScreen';
import { ProductListScreen } from './screens/ProductListScreen';
import { ProductDetailScreen } from './screens/ProductDetailScreen';
import { AddProductScreen } from './screens/AddProductScreen';
import { EditProductScreen } from './screens/EditProductScreen';
import { EditProfileScreen } from './screens/EditProfileScreen';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { OrderDetailScreen } from './screens/OrderDetailScreen';
import { VendorMapScreen } from './screens/VendorMapScreen';
import { UpdateLocationScreen } from './screens/UpdateLocationScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animationEnabled: false,
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen
      name="Register"
      component={RegisterScreen}
      options={{ animationEnabled: true }}
    />
  </Stack.Navigator>
);

// Vendor Navigation
const VendorTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName = 'home-outline';
        if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
        else if (route.name === 'Map') iconName = focused ? 'map' : 'map-outline';
        else if (route.name === 'Orders') iconName = focused ? 'list' : 'list-outline';
        else if (route.name === 'Notifications') iconName = focused ? 'notifications' : 'notifications-outline';
        else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: '#999',
      headerShown: false,
    })}
  >
    <Tab.Screen
      name="Dashboard"
      component={VendorDashboardScreen}
      options={{ title: 'Store' }}
    />
    <Tab.Screen
      name="Orders"
      component={OrderDetailScreen}
      options={{ title: 'Orders' }}
    />
    <Tab.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{ title: 'Alerts' }}
    />
    <Tab.Screen
      name="Profile"
      component={EditProfileScreen}
      options={{ title: 'Profile' }}
    />
  </Tab.Navigator>
);

// Customer Navigation
const CustomerTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName = 'home-outline';
        if (route.name === 'Explore') iconName = focused ? 'search' : 'search-outline';
        else if (route.name === 'Map') iconName = focused ? 'map' : 'map-outline';
        else if (route.name === 'Orders') iconName = focused ? 'bag' : 'bag-outline';
        else if (route.name === 'Notifications') iconName = focused ? 'notifications' : 'notifications-outline';
        else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: '#999',
      headerShown: false,
    })}
  >
    <Tab.Screen
      name="Explore"
      component={ProductListScreen}
      options={{ title: 'Browse' }}
    />
    <Tab.Screen
      name="Map"
      component={VendorMapScreen}
      options={{ title: 'Map' }}
    />
    <Tab.Screen
      name="Orders"
      component={OrderDetailScreen}
      options={{ title: 'Orders' }}
    />
    <Tab.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{ title: 'Alerts' }}
    />
    <Tab.Screen
      name="Profile"
      component={EditProfileScreen}
      options={{ title: 'Profile' }}
    />
  </Tab.Navigator>
);

// Vendor Stack with modal screens
const VendorStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animationEnabled: true,
    }}
  >
    <Stack.Group>
      <Stack.Screen name="VendorTabs" component={VendorTabNavigator} />
    </Stack.Group>
    <Stack.Group screenOptions={{ presentation: 'modal' }}>
      <Stack.Screen
        name="AddProduct"
        component={AddProductScreen}
        options={{ headerShown: true, title: 'Add Product' }}
      />
      <Stack.Screen
        name="EditProduct"
        component={EditProductScreen}
        options={{ headerShown: true, title: 'Edit Product' }}
      />
      <Stack.Screen
        name="UpdateLocation"
        component={UpdateLocationScreen}
        options={{ headerShown: true, title: 'Update Location' }}
      />
    </Stack.Group>
  </Stack.Navigator>
);

// Customer Stack with modal screens
const CustomerStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animationEnabled: true,
    }}
  >
    <Stack.Group>
      <Stack.Screen name="CustomerTabs" component={CustomerTabNavigator} />
    </Stack.Group>
    <Stack.Group screenOptions={{ presentation: 'modal' }}>
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ headerShown: true, title: 'Product' }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ headerShown: true, title: 'Checkout' }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ headerShown: true, title: 'Order Details' }}
      />
    </Stack.Group>
  </Stack.Navigator>
);

// Root Navigator with Auth State
const RootNavigator = () => {
  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            isLoading: false,
            userToken: action.payload.token,
            userType: action.payload.userType,
          };
        case 'SIGN_OUT':
          return {
            isLoading: false,
            userToken: null,
            userType: null,
          };
      }
    },
    {
      isLoading: true,
      userToken: null,
      userType: null,
    }
  );

  React.useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        const userType = await AsyncStorage.getItem('user_type');
        dispatch({ type: 'RESTORE_TOKEN', payload: { token, userType } });
      } catch (e) {
        dispatch({ type: 'RESTORE_TOKEN', payload: { token: null, userType: null } });
      }
    };

    bootstrapAsync();
  }, []);

  if (state.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {state.userToken == null ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : state.userType === 'vendor' ? (
        <Stack.Screen name="VendorApp" component={VendorStack} />
      ) : (
        <Stack.Screen name="CustomerApp" component={CustomerStack} />
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
