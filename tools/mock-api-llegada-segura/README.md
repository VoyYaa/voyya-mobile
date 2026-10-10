# API simulada del ciclo "Llegada segura"

Servidor local de un solo archivo, sin dependencias, para ver las pantallas del conductor y del pasajero
(ADR-033) mientras el backend del ciclo no está desplegado. **No reemplaza la verificación contra la API real**,
que hace `pruebas`: aquí el código, los intentos, el bloqueo y la ventana de seguimiento los decide este archivo,
no PostgreSQL.

```bash
node tools/mock-api-llegada-segura/server.mjs        # puerto 3999 (MOCK_API_PORT)
```

Escucha en `127.0.0.1`, sin autenticación real: el emulador llega con `10.0.2.2`. Para probar con un teléfono físico por la
red local, arráncalo con `MOCK_API_HOST=0.0.0.0` y solo en una red de confianza.

Las apps apuntan a él con `EXPO_PUBLIC_API_URL=http://10.0.2.2:3999` en el emulador de Android (el host es
`10.0.2.2`). Los tokens son fijos: `passenger-token` y `driver-token`. Cualquier teléfono, OTP, cédula y PIN
inician sesión.

## Qué simula

| Ruta | Comportamiento |
|---|---|
| `GET /driver/me`, `GET /trips/:id`, `GET /trips/active` | Los campos del contrato 0.10.0: `start_code`, `start_code_state`, `driver_tracking`, `start_code_required`, `start_attempts_remaining`, `start_blocked`, `pickup_location`, `dropoff_location` y `location_sharing`. `dropoff_location` solo en `in_progress` |
| `POST /trips/:id/start` | Valida el código: `422 START_CODE_INVALID` con `attempts_remaining`, `409 START_CODE_BLOCKED` a los 5 fallos, `422 START_CODE_REQUIRED` sin código |
| `POST /driver/location` | Guarda la posición, la anota en `reports` y responde `location_sharing` (nulo fuera de la ventana). Con `403 LOCATION_CONSENT_REQUIRED` si el aviso no está aceptado |
| `GET/POST /consents` | Aviso `location-notice-v3`; `requires_acceptance` según la versión |

El pasajero ve la posición que el conductor reportó de verdad (`age_sec` se calcula aquí), con los umbrales de
45 s y 300 s del contrato.

## Control

`POST /__control` con un cuerpo JSON. `GET /__state` devuelve el viaje, los reportes de ubicación y el registro de
llamadas.

| `action` | Efecto |
|---|---|
| `reset` | Estado inicial |
| `consent` | `{role, state, version}`, por ejemplo `{"role":"driver","state":"granted","version":"location-notice-v3"}` |
| `offer` | Crea una oferta aceptable por el conductor |
| `newTrip` | `{status, arrived, failed, blocked, exempt, code, assignedAgoSec}` |
| `set` | `{trip:{…}, control:{throttleNext:n, dropNext:true, offline:true}}`: `throttleNext` responde 429 con `Retry-After: 7` a los siguientes inicios; `dropNext` procesa el inicio y corta la conexión sin responder; `offline` corta todas las conexiones |
| `driverPosition` | `{lat, lng, ageSec}` fija la posición que ve el pasajero |
| `closeTrip` | `{status}` cierra el viaje |
