import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationService = {
  async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async registerForPushNotifications() {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Update with your Expo project ID
      });

      if (token.data) {
        await apiClient.registerPushToken(token.data);
        await AsyncStorage.setItem('push_token', token.data);
        console.log('Push token registered:', token.data);
      }
    } catch (error) {
      console.error('Failed to get push token:', error);
    }
  },

  async setupNotificationListeners(navigation: any) {
    let lastNotificationResponse: Notifications.NotificationResponse | null = null;

    const notificationListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        lastNotificationResponse = response;
        const { data } = response.notification.request.content;

        if (data && data.type === 'order_created') {
          navigation.navigate('Orders');
        } else if (data && data.type === 'order_paid') {
          navigation.navigate('Orders', { orderId: data.order_id });
        }
      }
    );

    const backgroundListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification received in background:', response);
      }
    );

    return () => {
      notificationListener.remove();
      backgroundListener.remove();
    };
  },

  async sendTestNotification() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test notification',
        sound: 'default',
      },
      trigger: { seconds: 1 },
    });
  },
};
