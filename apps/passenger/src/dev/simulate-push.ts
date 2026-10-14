import {
  ANDROID_TRIP_UPDATES_CHANNEL_ID,
  PASSENGER_PUSH_NOTIFICATION_TYPES,
  PassengerPushNotificationType,
} from '@voyyaa/shared';
import { loadNotificationsModule } from '@voyyaa/app-runtime';

const DEFAULT_DELAY_SEC = 3;

const SIMULATED_TEXT: Record<PassengerPushNotificationType, { title: string; body: string }> = {
  trip_driver_assigned: {
    title: '¡Ya tienes conductor!',
    body: 'Un conductor aceptó tu viaje. Abre VoyYa para ver quién es.',
  },
  trip_driver_reassigned: {
    title: 'Tienes un conductor nuevo',
    body: 'Abre VoyYa y revisa tu viaje antes de subir.',
  },
  trip_driver_cancelled_searching: {
    title: 'Tu conductor canceló',
    body: 'Estamos buscando otro conductor para ti.',
  },
  trip_driver_cancelled_ended: {
    title: 'Tu conductor canceló el viaje',
    body: 'Ya no viene a recogerte. Abre VoyYa para pedir otro taxi.',
  },
  trip_driver_arrived: {
    title: 'Tu conductor indica que llegó',
    body: 'Ve al punto de encuentro. Abre VoyYa y confirma que es tu taxi.',
  },
  trip_no_driver: {
    title: 'No encontramos conductor',
    body: 'Ahora no hay conductores disponibles. Abre VoyYa para intentar de nuevo.',
  },
};

async function scheduleLocalPush(
  data: Record<string, unknown>,
  text: { title: string; body: string },
  delaySec: number,
): Promise<boolean> {
  const notifications = await loadNotificationsModule();
  if (notifications === null) return false;
  await notifications.scheduleNotificationAsync({
    content: { title: text.title, body: text.body, data, sound: 'default' },
    trigger: { channelId: ANDROID_TRIP_UPDATES_CHANNEL_ID, seconds: Math.max(1, delaySec) },
  });
  return true;
}

export function simulatePush(
  type: PassengerPushNotificationType,
  tripRequestId: number,
  delaySec: number = DEFAULT_DELAY_SEC,
): Promise<boolean> {
  return scheduleLocalPush(
    { type, trip_request_id: String(tripRequestId) },
    SIMULATED_TEXT[type],
    delaySec,
  );
}

export function simulateRawPush(
  data: Record<string, unknown>,
  delaySec: number = DEFAULT_DELAY_SEC,
): Promise<boolean> {
  return scheduleLocalPush(data, SIMULATED_TEXT.trip_driver_assigned, delaySec);
}

export function installPushSimulator(): void {
  if (!__DEV__) return;
  const target = globalThis as Record<string, unknown>;
  target.voyyaSimulatePush = simulatePush;
  target.voyyaSimulateRawPush = simulateRawPush;
  target.voyyaPushTypes = PASSENGER_PUSH_NOTIFICATION_TYPES;
}
