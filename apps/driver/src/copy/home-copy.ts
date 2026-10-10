export const homeCopy = {
  onShiftEyebrow: 'En turno',
  offShiftEyebrow: 'Fuera de turno',
  waitingTitle: 'Esperando solicitudes',
  waitingBody: 'Sigues visible para los pasajeros.',
  consentPendingTitle: 'Aviso nuevo pendiente',
  consentPendingBody: 'Pronto dejarás de recibir solicitudes: acepta el aviso nuevo.',
  consentPendingHint: 'Sin el aviso nuevo dejarás de recibir solicitudes.',
  offShiftTitle: 'Estás fuera de turno',
  offShiftBody: 'Actívalo para empezar a recibir solicitudes cercanas.',
  activateShift: 'Activar turno',
  endShift: 'Terminar turno',
  shiftBusyOn: 'Activando turno…',
  shiftBusyOff: 'Actualizando turno…',
  shiftOnHint: 'Recibiendo solicitudes cercanas.',
  noVehicle: 'No tienes un vehículo vinculado. Contacta al administrador.',
  nearbyTitle: 'Solicitudes cercanas',
  seeAll: (count: number) => `Ver todas (${count})`,
  emptyTitle: 'Sin solicitudes cercanas por ahora',
  emptyBody: 'Sigues visible para los pasajeros.',
  emptyBodyConsentPending: 'Para volver a recibir solicitudes, acepta el aviso nuevo.',
  homeLoadError: 'No pudimos cargar tu estado de turno',
  offersLoadError: 'No pudimos cargar tus solicitudes',
  nearest: 'Más cercana',
  rulesTrigger: '¿Cómo se asignan los viajes?',
  rulesTitle: 'Reglas de asignación',
  rulesBody: (radiusKm: number, timeoutSec: number) =>
    `Mostradas por cercanía · radio ${radiusKm} km · ${timeoutSec} s para responder`,
  cashBanner: (count: number) =>
    count === 1
      ? 'Tienes 1 viaje sin confirmar el cobro.'
      : `Tienes ${count} viajes sin confirmar el cobro.`,
  accountOpen: 'Mi cuenta',
} as const;
