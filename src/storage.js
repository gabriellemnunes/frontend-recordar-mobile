import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
// Browser sessions stay in memory; native tokens use the OS keychain.
const memory = new Map();
export const storage = {
  get: (key) =>
    key !== "recordar_session"
      ? AsyncStorage.getItem(key)
      : Platform.OS === "web"
        ? Promise.resolve(memory.get(key) || null)
        : SecureStore.getItemAsync(key),
  set: (key, value) =>
    key !== "recordar_session"
      ? AsyncStorage.setItem(key, value)
      : Platform.OS === "web"
        ? Promise.resolve(memory.set(key, value))
        : SecureStore.setItemAsync(key, value),
  remove: (key) =>
    key !== "recordar_session"
      ? AsyncStorage.removeItem(key)
      : Platform.OS === "web"
        ? Promise.resolve(memory.delete(key))
        : SecureStore.deleteItemAsync(key),
};
