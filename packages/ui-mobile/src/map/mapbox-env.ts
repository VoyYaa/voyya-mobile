import Constants, { AppOwnership, ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

export function getMapboxAccessToken(): string | null {
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

export function isNativeMapAvailable(): boolean {
  if (Platform.OS === 'web') return false;

  const runningInExpoGo =
    Constants.appOwnership === AppOwnership.Expo ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  return !runningInExpoGo;
}
