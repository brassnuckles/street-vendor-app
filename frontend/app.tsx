import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { VendorDashboardScreen } from './screens/VendorDashboardScreen';
import { ProductListScreen } from './screens/ProductListScreen';
import { ProductDetailScreen } from './screens/ProductDetailScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

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

const VendorTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Dashboard') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Orders') {
          iconName = focused ? 'list' : 'list-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: '#999',
      headerShown: true,
    })}
  >
    <Tab.Screen
      name="Dashboard"
      component={VendorDashboardScreen}
      options={{ title: 'My Store' }}
    />
    <Tab.Screen
      name="Orders"
      component={ProductListScreen}
      options={{ title: 'Orders' }}
    />
    <Tab.Screen
      name="Profile"
      component={ProductListScreen}
      options={{ title: 'Profile' }}
    />
  </Tab.Navigator>
);

const CustomerTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Explore') {
          iconName = focused ? 'search' : 'search-outline';
        } else if (route.name === 'Orders') {
          iconName = focused ? 'bag' : 'bag-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: '#999',
      headerShown: true,
    })}
  >
    <Tab.Screen
      name="Explore"
      component={ProductListScreen}
      options={{ title: 'Explore' }}
    />
    <Tab.Screen
      name="Orders"
      component={ProductListScreen}
      options={{ title: 'My Orders' }}
    />
    <Tab.Screen
      name="Profile"
      component={ProductListScreen}
      options={{ title: 'Profile' }}
    />
  </Tab.Navigator>
);

const VendorStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="VendorTabs" component={VendorTabNavigator} />
    <Stack.Screen
      name="AddProduct"
      component={ProductListScreen}
      options={{ title: 'Add Product', headerShown: true }}
    />
    <Stack.Screen
      name="EditProduct"
      component={ProductListScreen}
      options={{ title: 'Edit Product', headerShown: true }}
    />
    <Stack.Screen
      name="EditVendorProfile"
      component={ProductListScreen}
      options={{ title: 'Edit Profile', headerShown: true }}
    />
  </Stack.Navigator>
);

const CustomerStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="CustomerTabs" component={CustomerTabNavigator} />
    <Stack.Screen
      name="ProductDetail"
      component={ProductDetailScreen}
      options={{ title: 'Product Details', headerShown: true }}
    />
    <Stack.Screen
      name="Checkout"
      component={ProductListScreen}
      options={{ title: 'Checkout', headerShown: true }}
    />
  </Stack.Navigator>
);

const RootNavigator = () => {
  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            isLoading: false,
            isSignout: false,
            userToken: action.payload.token,
            userType: action.payload.userType,
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            isSignout: false,
            userToken: action.payload.token,
            userType: action.payload.userType,
          };
        case 'SIGN_OUT':
          return {
            ...prevState,
            isSignout: true,
            userToken: null,
            userType: null,
          };
      }
    },
    {
      isLoading: true,
      isSignout: false,
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
