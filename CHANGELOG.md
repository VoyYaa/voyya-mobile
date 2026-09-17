# Changelog — voyya-mobile

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/). Fechas en AAAA-MM-DD.

## [Sin publicar] — 2026-09-16 · Ciclo "Viaje en curso y cobro en efectivo"

Contra los endpoints de `voyya-backend` documentados en
[docs/api/trips.md](../docs/api/trips.md) y [docs/api/driver.md](../docs/api/driver.md).

### Agregado (app `driver`)

- `src/api/driver.api.ts`: cliente para `PUT /driver/shift`, `POST /driver/location`, `GET /driver/me`,
  `GET /driver/trips/cash-pending`.
- `src/api/trips.api.ts`: cliente para las seis transiciones del viaje (`en-route`, `arrived`, `start`,
  `complete`, `no-show`, `cash-collected`).
- Pantallas y componentes de viaje activo: `app/trip/[id].tsx`, `FinishTripSheet`, `NoShowConfirmSheet`,
  `CancelTripSheet`, `CashPendingRow`, `PendingCashBanner`, `ShiftIssuePanel`; pantalla `app/cash-pending.tsx`
  para el aviso persistente de cobros sin confirmar.
- Hooks nuevos: `useDriverHome`, `useUpdateShift`, `useShiftActivation`, `useReportLocation`,
  `useTripActions`, `usePendingCashTrips`, `useConfirmCashCollected`.
- `src/constants/parameters.ts`: `LOCATION_REFRESH_MS` (5 min) para el refresco periódico de ubicación
  mientras el conductor está disponible sin viaje.

### Cambiado

- `src/state/useShiftStore.ts` deja de ser la fuente de verdad del turno: el interruptor ya no cambia
  visualmente hasta que el servidor responde (`DriverShiftState` vía TanStack Query). Antes era un booleano
  local que podía decir "En turno" mientras la base de datos decía `off_shift`.
- `apps/passenger/app/driver-assigned.tsx`: ramifica sobre el `PassengerUiState` ampliado (12 valores),
  incluido un cierre propio para `trip_completed`.

### Eliminado

- `apps/passenger/src/hooks/useTripSocket.ts`: apuntaba a un gateway de WebSocket que nunca existió. El
  sondeo de `useTripRequestStatus` (`GET /trips/:id`) es el único canal real de estado para el pasajero.

### Pendiente / EV1+

- Sin tracking GPS en segundo plano (decisión de producto, no gap — ver
  [ADR-011](../docs/architecture/decisions/ADR-011-turno-y-ubicacion-del-conductor-sin-tracking-continuo.md)).
- Sin recuperación si el teléfono del conductor se apaga a mitad de viaje: el viaje queda `in_progress`
  hasta intervención operativa manual (fuera de alcance de este ciclo).
