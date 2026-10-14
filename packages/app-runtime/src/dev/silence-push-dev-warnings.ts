import { LogBox } from 'react-native';

const PUSH_DEV_WARNINGS: readonly string[] = [
  '[expo-notifications]',
  'ERR_NOTIFICATIONS',
  'Fetching the token failed',
  'getExpoPushTokenAsync',
];

export function silencePushDevWarnings(): void {
  if (__DEV__) LogBox.ignoreLogs([...PUSH_DEV_WARNINGS]);
}
