import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { reminderPlan } from './reminderPlan';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
export async function clearReminders() {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of pending) if (n.identifier.startsWith('recordar-')) await Notifications.cancelScheduledNotificationAsync(n.identifier);
}
export async function requestReminders() {
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('consultas', { name: 'Consultas', importance: Notifications.AndroidImportance.HIGH });
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}
export async function syncReminders(appointments) {
  await clearReminders();
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return false;
  // Limite conservador para notificações pendentes no dispositivo.
  const plan = reminderPlan(appointments).sort((a, b) => a.date - b.date).slice(0, 60);
  for (const item of plan) await Notifications.scheduleNotificationAsync({
    identifier: item.id, content: { title: item.title, body: item.body, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: item.date, channelId: 'consultas' }
  });
  return true;
}
