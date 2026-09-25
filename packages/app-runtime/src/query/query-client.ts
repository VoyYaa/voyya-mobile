import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';

function handleAppStateChange(status: AppStateStatus): void {
  focusManager.setFocused(status === 'active');
}

let focusManagerWired = false;

function wireFocusManagerToAppState(): void {
  if (focusManagerWired) return;
  focusManagerWired = true;
  AppState.addEventListener('change', handleAppStateChange);
}

export function createQueryClient(): QueryClient {
  wireFocusManagerToAppState();
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        staleTime: 2000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
