import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { createReminderManager } from "./reminderManager";
import { medicationPlan } from "./medicationPlan";
const manager = createReminderManager(
  {
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
          ...(Platform.OS === "android" ? { channelId: "medicamentos" } : {}),
        },
      }),
  },
  medicationPlan,
  "recordar-med-",
  36,
);
export const medicationReminderVersion = () => manager.version();
export const clearMedicationReminders = () =>
  Platform.OS === "web" ? Promise.resolve() : manager.clear();
export const syncMedicationReminders = (list, revision) =>
  Platform.OS === "web" ? Promise.resolve(false) : manager.sync(list, revision);
export async function requestMedicationReminders() {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("medicamentos", {
      name: "Medicamentos",
      importance: Notifications.AndroidImportance.HIGH,
    });
  return (await Notifications.requestPermissionsAsync()).granted;
}
