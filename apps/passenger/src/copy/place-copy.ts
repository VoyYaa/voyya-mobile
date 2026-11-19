import { PIN_POINT_LABEL } from '../constants/pin-point';

export const placeCopy = {
  currentLocation: 'Tu ubicación actual',
  pinPoint: PIN_POINT_LABEL,
  tagGps: 'Por GPS',
  tagManual: 'Marcado a mano',
  addReference: 'Agregar referencia (opcional)',
  editReference: 'Editar',
  doneReference: 'Listo',
  reference: (text: string): string => `Referencia: ${text}`,
  routeApproximate: 'Ruta aproximada',
} as const;
