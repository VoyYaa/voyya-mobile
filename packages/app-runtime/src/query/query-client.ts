import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { wireFocusToAppState, wireOnlineToNetwork } from './focus-bridge';

let managersWired = false;

function wireManagers(): void {
  if (managersWired) return;
  managersWired = true;
  wireFocusToAppState(AppState, focusManager);
  wireOnlineToNetwork(NetInfo, onlineManager);
}

export function createQueryClient(): QueryClient {
  wireManagers();
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        staleTime: 2000,
        refetchOnWindowFocus: false,
        networkMode: 'always',
      },
      mutations: {
        retry: false,
        networkMode: 'always',
      },
    },
  });
}
