import { resolveApiBaseUrl } from '@voyyaa/app-runtime';
import Constants from 'expo-constants';

export const API_BASE_URL = resolveApiBaseUrl({
  configuredUrl: process.env.EXPO_PUBLIC_API_URL,
  metroHostUri: Constants.expoConfig?.hostUri,
  isDevelopment: __DEV__,
});
