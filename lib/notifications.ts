import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Ask permission + setup channel
export async function registerForPushNotifications() {
  const { status } = await Notifications.getPermissionsAsync();

  let finalStatus = status;

  if (status !== 'granted') {
    const request = await Notifications.requestPermissionsAsync();
    finalStatus = request.status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission denied');
    return;
  }

  // Android requires channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563eb',
    });
  }
}

// Trigger local push notification
export async function sendLowStockNotification(
  productName: string,
  stock: number
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Low Stock Alert',
      body: `${productName} is running low (${stock} left)`,
      sound: true,
    },
    trigger: null, // Immediate
  });
}
