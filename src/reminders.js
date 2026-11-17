import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { createReminderManager } from "./reminderManager";

if (Platform.OS !== "web")
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
const manager = createReminderManager({
  pending: () => Notifications.getAllScheduledNotificationsAsync(),
  cancel: (id) => Notifications.cancelScheduledNotificationAsync(id),
  permitted: async () => (await Notifications.getPermissionsAsync()).granted,
  schedule: (item) =>
    Notifications.scheduleNotificationAsync({
      identifier: item.id,
      content: { title: item.title, body: item.body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: item.date,
        ...(Platform.OS === "android" ? { channelId: "consultas" } : {}),
      },
    }),
});
export const clearReminders = () =>
  Platform.OS === "web" ? Promise.resolve() : manager.clear();
export const reminderVersion = () => manager.version();
export async function requestReminders() {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("consultas", {
      name: "Consultas",
      importance: Notifications.AndroidImportance.HIGH,
    });
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}
export const syncReminders = (appointments, expectedRevision) =>
  Platform.OS === "web"
    ? Promise.resolve(false)
    : manager.sync(appointments, expectedRevision);
