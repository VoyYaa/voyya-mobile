import type { DemoSession } from '@voyyaa/shared';

export const DEMO_FIXTURE: DemoSession = {
  municipality_id: 7,
  municipality_name: 'Villa Demo',
  center: { lat: 10.25, lng: -20.5 },
  places: [
    { key: 'plaza-demo', name: 'Plaza Demo', lat: 10.25, lng: -20.5 },
    { key: 'clinica-demo', name: 'Clínica Demo', lat: 10.26, lng: -20.51 },
  ],
};

export const EMPTY_DEMO_FIXTURE: DemoSession = { ...DEMO_FIXTURE, places: [] };
