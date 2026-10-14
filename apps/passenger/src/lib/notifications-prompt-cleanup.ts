import type { NotificationsPromptStore } from './notifications-prompt-store';

export type SessionClearedSubscriber = (handler: () => void | Promise<void>) => () => void;

export function clearPromptStateOnSessionEnd(
  subscribe: SessionClearedSubscriber,
  store: Pick<NotificationsPromptStore, 'clear'>,
): () => void {
  return subscribe(() => store.clear());
}
