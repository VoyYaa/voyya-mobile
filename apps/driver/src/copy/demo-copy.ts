export const demoCopy = {
  announce: 'Cuenta de demostración. Los datos son ficticios.',
  info: {
    body: 'Esta cuenta sirve para conocer la app. Los nombres, las placas y los números son inventados.',
    bullets: [
      'No usamos la ubicación de tu teléfono: se comparte un punto fijo.',
      'Ya hay un viaje asignado. Llega, inícialo con el código y termínalo.',
      'El cobro es de ejemplo: no se cobra dinero real.',
    ],
  },
  consentNote:
    'En esta cuenta de demostración no usamos la ubicación de tu teléfono, aunque aceptes.',
  disclosureNote:
    'En esta cuenta de demostración no usamos la ubicación de tu teléfono ni mostramos esa notificación: se comparte un punto fijo.',
  sharingActive: 'Compartiendo el punto de demostración con el pasajero',
  startCodeHint:
    'En la demostración, el código es el de 4 dígitos que recibiste con los datos de acceso.',
  cashNote: 'Cobro de demostración: no se cobra dinero real.',
  emptyOffersHint:
    'En la demostración llegan solicitudes solo si alguien pide un taxi desde la app del pasajero.',
  callUnavailable: 'No hay llamadas en la demostración',
  pinForbidden: 'Las cuentas de demostración no pueden cambiar el PIN.',
} as const;
