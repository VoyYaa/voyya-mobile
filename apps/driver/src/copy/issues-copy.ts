const CONSENT_REQUIRED = 'Si no lo aceptas, pronto dejarás de recibir solicitudes.';

export const issuesCopy = {
  permissionDenied: 'Necesitamos tu ubicación para activar el turno.',
  permissionDeniedAction: 'Cómo habilitarlo',
  gpsDisabled: 'Activa la ubicación de tu teléfono para poder recibir solicitudes.',
  gpsDisabledAction: 'Abrir ajustes',
  locationTimeout: 'No pudimos obtener tu ubicación a tiempo. Inténtalo de nuevo.',
  offline: 'Sin conexión · no pudimos activar tu turno.',
  serverError: 'No pudimos activar tu turno.',
  retry: 'Reintentar',
  blockedByTrip: 'No puedes salir de turno con un viaje en curso. Finalízalo o cancélalo primero.',
  consentRequired: CONSENT_REQUIRED,
  consentRequiredAction: 'Leer y aceptar',
  banner: {
    gps_disabled: {
      title: 'Ubicación apagada',
      body: 'Actívala para recibir solicitudes.',
      action: 'Abrir ajustes',
    },
    permission_denied: {
      title: 'Falta el permiso de ubicación',
      body: 'Sin él dejarás de recibir solicitudes.',
      action: 'Abrir ajustes',
    },
    consent_required: {
      title: 'Falta aceptar el aviso de ubicación',
      body: CONSENT_REQUIRED,
      action: 'Leer y aceptar',
    },
    precise_location_needed: {
      title: 'Activa la ubicación precisa',
      body: 'Así tu pasajero te ve en el mapa.',
      action: 'Abrir ajustes',
    },
  },
  tripBannerBody: {
    gps_disabled: 'Actívala para que tu pasajero te vea en el mapa.',
    permission_denied: 'Sin él tu pasajero no te verá en el mapa.',
    consent_required: 'Sin aceptarlo no podemos compartir tu ubicación con tu pasajero.',
  },
} as const;
