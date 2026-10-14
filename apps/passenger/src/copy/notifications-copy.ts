export const notificationsCopy = {
  sheet: {
    title: '¿Te avisamos de tu viaje?',
    body: 'Activa los avisos para saber cuándo un conductor acepta, llega o cancela, aunque cierres la app.',
    note: 'En algunos teléfonos pueden tardar o no llegar, así que mira la app de vez en cuando. Sin avisos, tu viaje sigue igual.',
    dataNote:
      'Para enviarte los avisos guardamos un identificador de este teléfono. Lo explicamos en la política.',
    accept: 'Activar avisos',
    accepting: 'Activando…',
    acceptHint: 'Muestra la pregunta de permiso del teléfono',
    decline: 'Ahora no',
  },
  banner: {
    keepOpen: 'Deja la app abierta para ver tu viaje.',
    dismiss: 'Cerrar aviso',
    askable: { title: 'Avisos apagados', action: 'Activar avisos' },
    blocked: {
      title: 'Avisos apagados en Ajustes',
      action: 'Abrir ajustes',
      actionHint: 'Se abre Ajustes del teléfono. Entra a Notificaciones y actívalas para VoyYa.',
    },
    failed: { title: 'No pudimos activar los avisos', action: 'Reintentar' },
    offline: {
      title: 'Avisos sin activar',
      body: 'Sin conexión. Deja la app abierta para ver tu viaje.',
    },
    unsupported: { title: 'Sin avisos en este teléfono' },
    activating: { title: 'Activando avisos…' },
    confirmed: { title: 'Avisos activados' },
  },
  foreground: {
    driverCancelledSearching: 'Tu conductor canceló. Estamos buscando otro conductor.',
    driverCancelledEnded: 'Tu conductor canceló el viaje. Puedes pedir otro taxi.',
    driverArrived: 'Tu conductor indica que llegó.',
    noDriver: 'No encontramos conductor. Puedes intentar de nuevo.',
  },
  tap: {
    notFound: 'No encontramos ese viaje.',
  },
  logout: {
    activeTripNote:
      'Tu viaje sigue en curso y no se cancela. Para verlo, tendrás que volver a ingresar.',
  },
  channel: {
    name: 'Avisos de tu viaje',
    description:
      'Cuando un conductor acepta, llega o cancela tu viaje, o cuando no encontramos conductor.',
  },
} as const;
