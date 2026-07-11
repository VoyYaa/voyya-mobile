import type { Coordinate } from '@voyyaa/shared';

export type PoiYarumalCategory = 'plaza' | 'salud' | 'gobierno' | 'transporte';

export interface PoiYarumal {
  id: string;
  icon: string;
  title: string;
  category: PoiYarumalCategory;
  coord: Coordinate | null;
}

export const POIS_YARUMAL: readonly PoiYarumal[] = [
  {
    id: 'parque-principal',
    icon: '⛪',
    title: 'Parque Principal',
    category: 'plaza',
    coord: { lat: 6.9617, lng: -75.4185 },
  },
  {
    id: 'hospital-san-juan-de-dios',
    icon: '🏥',
    title: 'Hospital San Juan de Dios',
    category: 'salud',
    coord: null,
  },
  {
    id: 'alcaldia',
    icon: '🏛️',
    title: 'Alcaldía de Yarumal',
    category: 'gobierno',
    coord: null,
  },
  {
    id: 'terminal',
    icon: '🚌',
    title: 'Terminal de Transportes',
    category: 'transporte',
    coord: null,
  },
];
