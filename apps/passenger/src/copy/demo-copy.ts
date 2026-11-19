export const demoCopy = {
  announce: 'Cuenta de demostración. Los datos son ficticios.',
  info: {
    body: 'Esta cuenta sirve para conocer la app. Los nombres, las placas y los números son inventados, y el mapa empieza en una ciudad de ejemplo.',
    bullets: [
      'No usamos la ubicación de tu teléfono.',
      'La tarifa es de ejemplo. No es una tarifa oficial.',
      'Los conductores de ejemplo no responden solos. Para ver un viaje, abre el que ya está en curso.',
    ],
  },
  referencePoint: (municipalityName: string): string => `Punto de referencia · ${municipalityName}`,
  useReferencePoint: 'Usar el punto de referencia',
  noOriginBody:
    'Elige el punto de recogida en la lista o en el mapa. En la demostración no usamos tu ubicación.',
  consentNote:
    'En esta cuenta de demostración no usamos tu ubicación, aunque aceptes: el mapa empieza en un punto fijo.',
  fareNote: 'Tarifa de ejemplo. No es una tarifa oficial.',
  searchingNote: 'En la demostración ningún conductor responde solo.',
  noDriverNote:
    'En la demostración ningún conductor responde solo. Vuelve al inicio y abre el viaje de ejemplo, si sigue en curso.',
  completedBody: 'Viaje de demostración: no se cobró dinero.',
  callUnavailable: 'No hay llamadas en la demostración',
  trackingUnavailableBody: 'Tu viaje sigue en pie.',
  coverageUnavailableTitle: 'La demostración no está disponible',
  coverageUnavailableBody:
    'Ya no podemos mostrar los datos de ejemplo. Cierra sesión e inténtalo más tarde.',
} as const;
