import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
// Browser sessions stay in memory; native tokens use the OS keychain.
const memory = new Map();
export const storage = {
  get: key => Platform.OS === 'web' ? Promise.resolve(memory.get(key) || null) : SecureStore.getItemAsync(key),
  set: (key,value) => Platform.OS === 'web' ? Promise.resolve(memory.set(key,value)) : SecureStore.setItemAsync(key,value),
  remove: key => Platform.OS === 'web' ? Promise.resolve(memory.delete(key)) : SecureStore.deleteItemAsync(key)
};
