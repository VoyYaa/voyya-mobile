import { getSecureStoragePort, onSessionCleared } from '@voyyaa/app-runtime';
import { clearPromptStateOnSessionEnd } from './notifications-prompt-cleanup';
import { createNotificationsPromptStore } from './notifications-prompt-store';

export const notificationsPromptStore = createNotificationsPromptStore({
  getItem: (key) => getSecureStoragePort().getItem(key),
  setItem: (key, value) => getSecureStoragePort().setItem(key, value),
  deleteItem: (key) => getSecureStoragePort().deleteItem(key),
});

export function registerPromptStateCleanup(): () => void {
  return clearPromptStateOnSessionEnd(onSessionCleared, notificationsPromptStore);
}
