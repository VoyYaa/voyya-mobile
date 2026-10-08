export type TripStatusValue =
  | 'pending_assignment'
  | 'assigned'
  | 'driver_en_route'
  | 'in_progress'
  | 'completed'
  | 'cancelled_by_passenger'
  | 'cancelled_by_driver'
  | 'no_driver'
  | 'no_show'
  | 'expired';

export type StatusTone = 'brand' | 'success' | 'danger' | 'info' | 'neutral' | 'strong' | 'warning';

export interface TripStatusTone {
  tone: StatusTone;
  label: string;
  pulse: boolean;
}

export interface TripStatusToneOptions {
  arrived?: boolean;
}

const TRIP_STATUS_TONES: Record<TripStatusValue, TripStatusTone> = {
  pending_assignment: { tone: 'brand', label: 'Buscando conductor', pulse: true },
  assigned: { tone: 'brand', label: 'Conductor asignado', pulse: false },
  driver_en_route: { tone: 'brand', label: 'En camino', pulse: false },
  in_progress: { tone: 'strong', label: 'En viaje', pulse: false },
  completed: { tone: 'success', label: 'Completado', pulse: false },
  cancelled_by_passenger: { tone: 'neutral', label: 'Cancelado', pulse: false },
  cancelled_by_driver: { tone: 'neutral', label: 'Cancelado', pulse: false },
  no_driver: { tone: 'danger', label: 'Sin conductor', pulse: false },
  no_show: { tone: 'danger', label: 'No se presentó', pulse: false },
  expired: { tone: 'neutral', label: 'Expirada', pulse: false },
};

const ARRIVED_TONE: TripStatusTone = { tone: 'success', label: 'Llegó', pulse: false };

export const CASH_PENDING_TONE: TripStatusTone = {
  tone: 'warning',
  label: 'Cobro pendiente',
  pulse: false,
};

export function tripStatusTone(
  status: TripStatusValue,
  { arrived = false }: TripStatusToneOptions = {},
): TripStatusTone {
  if (status === 'driver_en_route' && arrived) return ARRIVED_TONE;
  return TRIP_STATUS_TONES[status];
}
