import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter, type Router } from 'expo-router';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { PushNotificationData } from '@voyyaa/shared';
import { NEARBY_OFFERS_QUERY_KEY } from '../hooks/useNearbyOffers';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function routeToOffer(router: Router, rawData: unknown): void {
  const parsed = PushNotificationData.safeParse(rawData);
  if (!parsed.success) return;

  switch (parsed.data.type) {
    case 'assignment_offer':
      router.push({
        pathname: '/requests/[id]',
        params: { id: String(parsed.data.assignment_id) },
      });
      return;
    default: {
      const exhaustive: never = parsed.data.type;
      return exhaustive;
    }
  }
}

export function useNotificationRouting(): void {
  const router = useRouter();
  const queryClient: QueryClient = useQueryClient();

  useEffect(() => {
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      routeToOffer(router, response.notification.request.content.data);
    });
  }, []);

  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      void queryClient.invalidateQueries({ queryKey: NEARBY_OFFERS_QUERY_KEY });
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      routeToOffer(router, response.notification.request.content.data);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [router, queryClient]);
}
