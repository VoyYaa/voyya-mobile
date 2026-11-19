import type { Coordinate } from '@voyyaa/shared';

export type PlaceCategory = 'plaza' | 'salud' | 'gobierno' | 'transporte';

export interface VerifiedPlace {
  id: string;
  title: string;
  category: PlaceCategory;
  coord: Coordinate | null;
}
