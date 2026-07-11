# frontend-yavoy

Apps móviles de **VoyYa** (Expo / React Native), listas para build por **EAS**: pasajero y
conductor, más el design system y los contratos que comparten.

Este repo es una **copia standalone** (no un fork/submódulo) de las carpetas móviles del
monorepo VoyYa. El monorepo original queda intacto; este repo existe para poder versionar y
desplegar el móvil de forma independiente (EAS) sin arrastrar el backend ni la consola Admin
(la consola Admin vive en su propio repo, `frontend-yavoy-admin`, desplegado en Vercel).

## Estructura

```
frontend-yavoy/
├── apps/
│   ├── passenger/        # App del pasajero (Expo Router) — @voyya/passenger
│   │   ├── app/           # Rutas (expo-router)
│   │   ├── src/           # api, components, constants, hooks, lib, state
│   │   ├── app.json        # Config de Expo (name, slug, scheme, plugins)
│   │   ├── eas.json         # Perfiles de build EAS (development/preview/production)
│   │   └── .env.example
│   └── driver/            # App del conductor (Expo Router) — @voyya/driver
│       ├── app/ src/ app.json eas.json .env.example  (misma forma que passenger)
├── packages/
│   ├── ui-mobile/         # @voyya/ui-mobile — design system RN (tokens cálidos, componentes)
│   └── shared/            # @voyya/shared — contratos Zod/DTOs/máquina de estados (ver nota abajo)
├── pnpm-workspace.yaml
├── package.json            # scripts raíz (turbo): dev/build/test/lint/typecheck/format
├── tsconfig.base.json       # TS strict compartido (noUncheckedIndexedAccess, sin any, etc.)
├── turbo.json               # orquesta el orden build → typecheck/lint entre paquetes
├── .eslintrc.cjs / .prettierrc / .npmrc
└── .gitignore
```

`@voyya/shared` y `@voyya/ui-mobile` se resuelven **por workspace** (`workspace:*` en los
`package.json` de `passenger`/`driver`) — pnpm los enlaza automáticamente, no hace falta
publicarlos en ningún registro para desarrollar localmente.

## Requisitos

- Node.js ≥ 20, [pnpm](https://pnpm.io) 10.24.0 (`corepack enable` o `npm i -g pnpm@10.24.0`)
- Cuenta de [Expo](https://expo.dev) + [EAS CLI](https://docs.expo.dev/eas/) (`npm i -g eas-cli`)
  para builds nativos (APK/IPA)
- Un backend VoyYa corriendo (o accesible) para `EXPO_PUBLIC_API_URL`

## Instalación

```bash
pnpm install
```

## Correr cada app en desarrollo

```bash
# Pasajero
cp apps/passenger/.env.example apps/passenger/.env   # ajusta las variables (ver abajo)
pnpm --filter @voyya/passenger start                  # o: cd apps/passenger && pnpm start

# Conductor
cp apps/driver/.env.example apps/driver/.env
pnpm --filter @voyya/driver start
```

Esto levanta el bundler de Expo (Metro) con un QR para abrir en **Expo Go** (funcionalidad
limitada: el mapa nativo `@rnmapbox/maps` NO funciona en Expo Go, ver `packages/ui-mobile`
`map/mapbox-env.ts` — se degrada a `MapFallback` automáticamente) o en un **dev client**
generado por EAS (`--profile development`, mapa nativo completo).

Antes de correr `start`, si tocaste `packages/shared` o `packages/ui-mobile`, constrúyelos
primero (los apps consumen su `dist/` compilado, no el código fuente directamente):

```bash
pnpm --filter @voyya/shared --filter @voyya/ui-mobile build
```

## Variables de entorno móvil

Cada app trae su `.env.example`. Expo solo expone al bundle del cliente las variables con
prefijo `EXPO_PUBLIC_*` (inyectadas en **build-time**, no en runtime — cualquier cambio exige
reiniciar el bundler / rehacer el build).

| Variable                     | App              | Descripción                                                                                          |
| ----------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`         | passenger, driver | URL base del backend NestJS (`http://localhost:3000` en local).                                       |
| `EXPO_PUBLIC_MAPBOX_TOKEN`    | passenger, driver | Token **público** de Mapbox (prefijo `pk.`) para `@rnmapbox/maps` 10.2.x.                              |

**Nota importante sobre Mapbox:** con `@rnmapbox/maps` 10.2.x **no hace falta** el "download
token" (`sk.…`, scope `DOWNLOADS:READ`) para las variables de entorno de la app — ese es un
secreto de **build**, no de runtime: se configura una sola vez a nivel de cuenta EAS/CI (o en
`~/.netrc` / credenciales de Gradle en local) para poder **descargar el SDK nativo** de Mapbox
durante `eas build`/`gradle`, y **nunca** debe versionarse ni ir en `.env` del proyecto. El
único token que consume la app en tiempo de ejecución es el público `pk.…`, vía
`EXPO_PUBLIC_MAPBOX_TOKEN` (ver `packages/ui-mobile/src/map/mapbox-env.ts`).

## EAS — build de APK (preview)

Cada app ya trae su `eas.json` con 3 perfiles:

- **`development`** — `developmentClient: true`, `distribution: internal` (dev client para
  probar con Metro conectado, incluye módulos nativos como el mapa).
- **`preview`** — Android **APK** (`buildType: apk`), `distribution: internal` (instalable
  directo por link/QR, sin pasar por Play Store — ideal para QA/demo).
- **`production`** — perfil de release (`autoIncrement: true`; Android generará `.aab` por
  defecto, apto para publicar).

> Estos perfiles están **preparados pero NO ejecutados** en este assembly: no hay sesión de
> EAS disponible en este entorno. Pasos para el primer build real (por app):

```bash
eas login                                   # una vez, con tu cuenta Expo/EAS

cd apps/passenger                           # (repetir luego en apps/driver)
eas init                                    # crea/asocia el proyecto EAS, escribe extra.eas.projectId en app.json
eas build -p android --profile preview      # genera el APK internal (QR/link de descarga)
```

Repite `eas init` + `eas build` dentro de `apps/driver` (son dos proyectos EAS separados, un
`eas.json`/`app.json` cada uno). Para builds de producción: `eas build -p android --profile
production` (y su equivalente iOS con perfil propio si se agrega más adelante).

## Nota de sincronización de `packages/shared`

`packages/shared` (contratos Zod, DTOs, máquina de estados) es una **copia duplicada** del
`packages/shared` que vive en `backend-yavoy` (monorepo VoyYa) — ambos deben tener el
**mismo contenido**. Al no compartir un único paquete publicado, cualquier cambio en el
contrato (ADR-005, nuevos endpoints, nuevos campos) debe replicarse manualmente en ambos
repos hasta que se resuelva. Mismo criterio aplica al `packages/shared` vendorizado en
`frontend-yavoy-admin` (ver su propio README) — **tres copias** a día de hoy.

Opciones para el futuro (fuera de alcance de este assembly):

1. Publicar `@voyya/shared` como paquete **privado** (npm/GitHub Packages/registro interno) y
   que los tres repos lo consuman como dependencia versionada normal (deja de ser copy-paste).
2. Adoptar un monorepo único con submódulos/subtree si se prefiere seguir sin registro privado.

Hasta entonces: **si tocas `packages/shared` aquí, replica el cambio en `backend-yavoy` y en
`frontend-yavoy-admin` (o su equivalente vendorizado) en el mismo PR/commit lógico.**

## Verificación

```bash
pnpm install
pnpm run build       # turbo: compila @voyya/shared y @voyya/ui-mobile (dist/) — dependencia de tipos de passenger/driver
pnpm run typecheck   # turbo: tsc --noEmit en los 4 paquetes (respeta el orden build → typecheck)
pnpm run lint        # turbo: eslint en los 4 paquetes
```

> `turbo.json` declara `"typecheck": { "dependsOn": ["^build"] }`: por eso los scripts raíz usan
> `turbo run …` (vía `pnpm run typecheck`/`pnpm run lint`/`pnpm run build`) en vez de
> `pnpm -r typecheck` directo — `pnpm -r` no encadena scripts *distintos* entre paquetes (no
> sabe que `typecheck` de `passenger` depende del `build` de `shared`/`ui-mobile`), así que sin
> Turbo fallaría en un clon nuevo con "Cannot find module '@voyya/shared'" hasta compilar sus
> `dist/` primero. Si prefieres comandos `pnpm -r` sueltos: `pnpm -r build && pnpm -r typecheck
> && pnpm -r lint` (mismo resultado, orden manual).

**Lo que este entorno NO puede verificar:** el render nativo (mapa, cámara, sensores) de
`passenger`/`driver` — requiere un dev-client o un dispositivo/emulador real (`expo start` +
Expo Go/dev client, o un build EAS instalado). El typecheck/lint sí cubre el código completo
(TS strict, sin `any`, ESLint) sin necesidad de ese entorno.

## Principios

TypeScript **strict** (sin `any` — regla dura vía ESLint `@typescript-eslint/no-explicit-any:
error`), SOLID/DRY/KISS, sin secretos versionados (`.env*` real está en `.gitignore`; solo
`.env.example` se versiona).
