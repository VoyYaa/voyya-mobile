import type { DemoSession, Location } from '@voyyaa/shared';
import { demoCopy } from '../copy/demo-copy';

type Point = Pick<Location, 'lat' | 'lng'>;

export function demoReferenceOrigin(demo: DemoSession): Location {
  return {
    address: demoCopy.referencePoint(demo.municipality_name),
    lat: demo.center.lat,
    lng: demo.center.lng,
  };
}

export function isDemoReferenceOrigin(origin: Point | null, demo: DemoSession | null): boolean {
  return (
    origin !== null &&
    demo !== null &&
    origin.lat === demo.center.lat &&
    origin.lng === demo.center.lng
  );
}

export interface DemoOriginSeedInput {
  demo: DemoSession | null;
  origin: Location | null;
  alreadySeeded: boolean;
  activeTripKnown: boolean;
  hasActiveTrip: boolean;
}

export function shouldSeedDemoOrigin(input: DemoOriginSeedInput): boolean {
  return (
    input.demo !== null &&
    input.origin === null &&
    !input.alreadySeeded &&
    input.activeTripKnown &&
    !input.hasActiveTrip
  );
}
