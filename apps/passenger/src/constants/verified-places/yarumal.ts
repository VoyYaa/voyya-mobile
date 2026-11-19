import type { VerifiedPlace } from './types';

export const YARUMAL_NAME = 'Yarumal';

export const YARUMAL_PLACES: readonly VerifiedPlace[] = [
  {
    id: 'parque-principal',
    title: 'Parque Principal',
    category: 'plaza',
    coord: { lat: 6.9617, lng: -75.4185 },
  },
  {
    id: 'hospital-san-juan-de-dios',
    title: 'Hospital San Juan de Dios',
    category: 'salud',
    coord: null,
  },
  {
    id: 'alcaldia',
    title: 'Alcaldía',
    category: 'gobierno',
    coord: null,
  },
  {
    id: 'terminal',
    title: 'Terminal de Transportes',
    category: 'transporte',
    coord: null,
  },
];
