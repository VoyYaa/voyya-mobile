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

| Variable                   | App               | Descripción                                                               |
| -------------------------- | ----------------- | ------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`      | passenger, driver | URL base del backend NestJS (`http://localhost:3000` en local).           |
| `EXPO_PUBLIC_MAPBOX_TOKEN` | passenger, driver | Token **público** de Mapbox (prefijo `pk.`) para `@rnmapbox/maps` 10.2.x. |

**Nota importante sobre Mapbox:** con `@rnmapbox/maps` 10.2.x **no hace falta** el "download
token" (`sk.…`, scope `DOWNLOADS:READ`) para las variables de entorno de la app — ese es un
secreto de **build**, no de runtime: se configura una sola vez a nivel de cuenta EAS/CI (o en
`~/.netrc` / credenciales de Gradle en local) para poder **descargar el SDK nativo** de Mapbox
durante `eas build`/`gradle`, y **nunca** debe versionarse ni ir en `.env` del proyecto. El
único token que consume la app en tiempo de ejecución es el público `pk.…`, vía
`EXPO_PUBLIC_MAPBOX_TOKEN` (ver `packages/ui-mobile/src/map/mapbox-env.ts`).

## EAS — Development Build (Android e iOS)

Cada app trae su `eas.json` con **4 perfiles**:

- **`development`** — `developmentClient: true`, `distribution: internal`. Android genera
  **APK instalable directo** (`android.buildType: "apk"`, explícito — no se deja al default
  implícito de EAS aunque coincida, para que quede a la vista y no dependa de una versión de
  CLI). iOS por defecto en este perfil construye para **dispositivo físico**.
- **`development-simulator`** — `extends: "development"` + `ios.simulator: true`. Build de
  **simulador de iOS**: no necesita cuenta de Apple Developer (de pago), pero sí un **Mac**
  para ejecutar el simulador. Es la vía gratuita para probar en iOS sin presupuesto aprobado.
- **`preview`** — Android **APK** (`buildType: apk`), `distribution: internal` (instalable
  directo por link/QR, sin pasar por Play Store — ideal para QA/demo).
- **`production`** — perfil de release (`autoIncrement: true`; Android genera `.aab` por
  defecto, apto para publicar).

> Estos perfiles están **preparados pero NO ejecutados**: no hay sesión de EAS disponible en
> este entorno (el registro de npm corporativo bloquea instalar `eas-cli`, y el proyecto nunca
> se vinculó a una cuenta Expo — no hay `owner` real ni `extra.eas.projectId` en `app.json`).
> Lo que sigue es el procedimiento exacto para la primera ejecución real, con red disponible.

### Qué se configuró y por qué

**1. Variables `EXPO_PUBLIC_*` en tiempo de build.** Se inyectan al compilar, no en runtime;
si EAS no las tiene, la app se construye sin URL de API ni token de mapas. Se resolvió con un
criterio distinto por variable:

| Variable                         | Naturaleza                                                                                                              | Dónde vive                                                                                                     | Por qué                                                                                                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`            | Cambia por entorno, **no es secreta**                                                                                   | Bloque `env` de cada perfil en `eas.json` (versionado)                                                         | Es texto plano, distinto por perfil (dev/preview/prod), y conviene verlo en el diff de un PR como cualquier otra config de entorno                               |
| `EXPO_PUBLIC_MAPBOX_TOKEN` (pk.) | **Pública** por diseño de Mapbox, pero conviene poder **restringirla/rotarla** (por dominio/bundle id) sin tocar código | Variable de entorno de EAS (`eas env:create`, `--visibility plaintext`), atada a cada `environment` del perfil | No es secreta, pero tampoco es texto que uno quiera reeditar en un PR cada vez que Mapbox la restrinja o rote; se gestiona como config operativa, no como código |

`eas.json` ya trae los valores de `EXPO_PUBLIC_API_URL` como **marcadores** (`REEMPLAZAR-…`)
que fallan de forma ruidosa (URL inválida) si alguien olvida reemplazarlos — no se dejó un
valor "razonable pero falso" que pudiera pasar desapercibido.

**2. Token de descarga de Mapbox (`sk.`, scope `DOWNLOADS:READ`).** `@rnmapbox/maps` necesita
este token **solo en tiempo de build** (para descargar el SDK nativo de Mapbox vía Gradle/
CocoaPods) — nunca en runtime ni en el bundle JS. No va en `.env`, no va en `app.json`, no se
versiona. Va como **secreto de EAS**, con el nombre exacto que el plugin
`@rnmapbox/maps/app.plugin.js` espera: **`RNMAPBOX_MAPS_DOWNLOAD_TOKEN`**.

> ⚠️ Este nombre de variable es el documentado por `@rnmapbox/maps` para su integración con
> EAS Build (recogida automática por el config plugin sin tocar `app.json`). No se pudo
> confirmar contra la documentación en vivo desde este entorno (sin red): es el primer punto
> de la lista de verificaciones pendientes más abajo. Si la primera build falla intentando
> descargar el SDK de Mapbox, el plan B (sin instalar nada nuevo) es convertir `app.json` a
> `app.config.js` y pasar el token explícito al plugin:
>
> ```js
> // app.config.js — solo si RNMAPBOX_MAPS_DOWNLOAD_TOKEN no se recoge automático
> const base = require('./app.json');
> module.exports = ({ config }) => ({
>   ...base.expo,
>   plugins: [
>     'expo-router',
>     'expo-secure-store',
>     [
>       '@rnmapbox/maps/app.plugin.js',
>       { RNMapboxMapsDownloadToken: process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN },
>     ],
>   ],
> });
> ```

Cómo se crea el token (cuenta Mapbox, no VoyYa/EAS):

1. Entrar a [account.mapbox.com/access-tokens](https://account.mapbox.com/access-tokens/) con
   la cuenta Mapbox de VoyYa (o crear una).
2. **Create a token** → nombre descriptivo (`voyya-eas-downloads`) → en **Secret scopes**
   activar **`DOWNLOADS:READ`** → generar. El token generado empieza por `sk.`.
3. **No pegarlo en ningún archivo del repo.** Se registra directo en EAS (paso 5 del runbook).

**3. `packages/*/dist` en el runner de EAS.** Los tres paquetes del workspace (`shared`,
`ui-mobile`, `app-runtime`) se consumen por su `main`/`types`, que apuntan a `dist/`. EAS
ejecuta su propio `pnpm install` en la nube, pero **nada garantiza que compile `dist/` antes
del build nativo** (riesgo anotado y no verificado en ADR-007 y ADR-008). Se resolvió con un
hook `eas-build-post-install` en el `package.json` de **cada app**:

```json
"eas-build-post-install": "cd ../.. && pnpm run build"
```

Se eligió `eas-build-post-install` (no `eas-build-pre-install`) porque corre **después** de
`pnpm install` — los paquetes ya existen y sus propias `devDependencies` (p. ej. `typescript`)
ya están instaladas, así que `tsc` puede correr — y **antes** de que Metro empaquete el JS.
Se reutiliza el script raíz `pnpm run build` (el mismo que corre en CI) en vez de duplicar la
lista de `--filter` en el hook: una sola definición de "cómo se construyen los paquetes".

**4. iOS sin cuenta de pago.** El perfil `development-simulator` (arriba) cubre la vía gratuita.
Un build para **dispositivo físico** (perfil `development` con `-p ios`) sí exige Apple
Developer Program (99 USD/año) para registrar el dispositivo y firmar — ver "Decisiones
pendientes" al final.

**5. Android — APK, no AAB.** El perfil `development` ya traía `developmentClient: true` +
`distribution: internal`, que en muchas versiones de EAS CLI ya _implican_ `apk` por defecto.
Para no depender de ese default implícito (y que quede legible sin tener que conocer la regla),
se dejó `"android": { "buildType": "apk" }` **explícito** en el perfil, igual que en `preview`.

### Runbook — primera ejecución real (con red disponible)

Ejecutar en `voyya-mobile/`, repitiendo los pasos marcados **(por app)** dentro de
`apps/passenger` y luego de `apps/driver` (son **dos proyectos EAS independientes**).

1. **Instalar `eas-cli`** (una vez, global o vía `npx`):
   ```bash
   npm install -g eas-cli
   # o, sin instalar global: usar `npx eas-cli@latest <comando>` en cada paso siguiente
   ```
2. **Login** con la cuenta Expo/EAS de VoyYa:
   ```bash
   eas login
   ```
3. **(Opcional) `owner` de organización.** Si el proyecto debe vivir bajo una organización
   Expo (no bajo tu usuario personal), edita **antes** de `eas init` el `app.json` de la app
   y reemplaza el marcador ya presente:
   ```json
   "owner": "REEMPLAZAR_CUENTA_O_ORG_EXPO"
   ```
   por el slug real (visible en `expo.dev/accounts/[cuenta]`). Si el proyecto va bajo tu
   cuenta personal, **borra la línea `owner` completa** — dejarla con el marcador hace que
   `eas init` falle de inmediato con un error legible ("cuenta no encontrada"), a propósito
   (mejor eso que asociarlo en silencio a la cuenta equivocada).
4. **`eas init`** — **(por app)**, crea/asocia el proyecto EAS y escribe
   `extra.eas.projectId` en `app.json` (no se inventó aquí, lo genera este comando):
   ```bash
   cd apps/passenger && eas init
   cd ../driver && eas init
   ```
5. **Registrar variables y secretos** — **(por app)**, dentro del directorio de cada proyecto:
   ```bash
   # Token público de Mapbox (pk.) — no secreto, pero gestionado fuera del repo
   eas env:create --scope project --name EXPO_PUBLIC_MAPBOX_TOKEN \
     --value "pk.TU_TOKEN_PUBLICO" --environment development,preview,production \
     --visibility plaintext

   # Token de descarga de Mapbox (sk., DOWNLOADS:READ) — secreto real
   eas env:create --scope project --name RNMAPBOX_MAPS_DOWNLOAD_TOKEN \
     --value "sk.TU_TOKEN_DOWNLOADS_READ" --environment development,preview,production \
     --visibility secret
   ```
   > Si tu versión de `eas-cli` no trae `eas env:create` (comando "Environment variables",
   > introducido después de la versión mínima `>= 12.0.0` fijada en `eas.json`), usa el
   > equivalente legado: `eas secret:create --scope project --name RNMAPBOX_MAPS_DOWNLOAD_TOKEN
--value "sk.…" --type string`. Verifica con `eas env:create --help` cuál soporta tu CLI.
   >
   > `EXPO_PUBLIC_API_URL` **no** se registra aquí: ya vive en `eas.json` (ver tabla arriba) —
   > solo hay que reemplazar los valores `REEMPLAZAR-…` por las URLs reales antes de construir.
6. **Build Android — `development`** (APK instalable directo, con dev client):
   ```bash
   eas build -p android --profile development
   ```
7. **Build iOS — dispositivo físico** (`development`): **requiere Apple Developer Program**
   (99 USD/año, ver "Decisiones pendientes"). Con la cuenta activa:
   ```bash
   eas build -p ios --profile development
   ```
   `eas-cli` pedirá credenciales de Apple y gestionará certificados/provisioning
   automáticamente (managed credentials) si respondes "sí" a que EAS los administre.
8. **Build iOS — simulador** (gratis, sin cuenta de pago; requiere un Mac para ejecutar el
   resultado):
   ```bash
   eas build -p ios --profile development-simulator
   ```
9. **Instalar el resultado:**
   - **Android APK:** el link/QR que entrega `eas build` al terminar descarga el `.apk`
     directo — instalar habilitando "orígenes desconocidos" en el dispositivo.
   - **iOS dispositivo físico:** el dispositivo debe estar registrado en el portal de Apple
     Developer (EAS lo hace por ti la primera vez con `eas device:create`); instalar desde el
     link que entrega EAS (perfil ad-hoc) o vía TestFlight si se sube.
   - **iOS simulador:** descargar el `.tar.gz`/`.app` del link de build y, en un Mac con
     Xcode, `xcrun simctl install booted <ruta-al-.app>` (o arrastrarlo al simulador abierto),
     o directamente `eas build:run -p ios --profile development-simulator`.
10. **Si el registro de npm corporativo sigue bloqueado** (no se puede instalar `eas-cli`
    localmente): usar un runner con salida a Internet en vez de la máquina corporativa —
    la opción más simple es un workflow de **GitHub Actions** (los runners hospedados por
    GitHub no están detrás del proxy corporativo): instalar `eas-cli` ahí, autenticar con
    `EXPO_TOKEN` (secret del repo, generado en `expo.dev/settings/access-tokens`) y correr
    `eas build --non-interactive --profile <perfil> -p <plataforma>`. Alternativas: una red
    distinta (hotspot móvil) para instalar `eas-cli` una sola vez, o pedir a IT que permita
    `registry.npmjs.org` (ya permite `api.expo.dev`, que es donde corre el build en sí — el
    bloqueo hoy es solo para instalar el CLI, no para el servicio de build).

### Verificaciones que solo se pueden hacer con la primera build real

Nada de esto se pudo comprobar desde este entorno (sin `eas-cli`, sin cuenta Expo, sin red al
registro de npm). Reportar cualquier desviación a `arquitectura` (hereda la lista de ADR-008 §10
más los puntos nuevos de esta tarea):

- [ ] Que el runner de EAS **aplica** `voyya-mobile/.npmrc` (`node-linker=hoisted`): el layout
      instalado debe quedar plano, no aislado (ver ADR-008).
- [ ] Que el hook `eas-build-post-install` efectivamente corre y **compila `packages/*/dist`**
      antes del bundling — si falla, revisar que el runner tenga `devDependencies` (TypeScript)
      ya instaladas en ese punto del ciclo.
- [ ] Que las tres `EXPO_PUBLIC_*` (`API_URL`, `MAPBOX_TOKEN`) **llegan inyectadas** al bundle
      final — confirmar en runtime de la app instalada (no solo que el build no falle).
- [ ] Que `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` es efectivamente recogido por
      `@rnmapbox/maps/app.plugin.js` **sin** tocar `app.json` (o si hace falta el plan B de
      `app.config.js` documentado arriba).
- [ ] Que `@rnmapbox/maps` **funciona en tiempo de ejecución** en un dispositivo/simulador
      real — confirma o descarta la sospecha, heredada de ADR-008 §10, del import **estático**
      de `@rnmapbox/maps` en `packages/ui-mobile/src/map/NativeMap.tsx` (confirmado en esta
      tarea: es un `import` estático de módulo, no un `require` perezoso; `Map.tsx` solo evita
      **renderizarlo** vía `isNativeMapAvailable()`, no evita que Metro lo empaquete — en un
      dev-client/APK real el módulo nativo sí está compilado, así que en teoría no debería
      fallar, pero nunca se ha ejecutado).
- [ ] Que el **autolinking nativo** encuentra `@rnmapbox/maps`, `expo-secure-store` y
      `@react-native-community/netinfo` en el layout plano que deja `hoisted`.
- [ ] Que no reaparece la advertencia de versión de `typescript` (u otra) reordenada por el
      hoisting en un paquete que **sí** entra al bundle (la vista en local fue benigna,
      `typescript` es solo de desarrollo).
- [ ] Que la caché de EAS entre builds **no revierte** el layout plano (repetir una segunda
      build seguida de la primera).
- [ ] Que `android.buildType: "apk"` en `development` produce de verdad un `.apk` instalable
      directo (nunca ejecutado; es la razón por la que se dejó explícito y no implícito).
- [ ] Que `development-simulator` (`ios.simulator: true`) efectivamente **no pide** login de
      Apple ni Apple Developer Program al construir.
- [ ] Que `eas env:create`/`eas secret:create` con los nombres exactos usados aquí
      (`EXPO_PUBLIC_MAPBOX_TOKEN`, `RNMAPBOX_MAPS_DOWNLOAD_TOKEN`) existen tal cual en la
      versión de `eas-cli` que se instale (`>= 12.0.0` es un mínimo amplio; confirmar con
      `eas env:create --help`).

### Decisiones pendientes (no se toman aquí — requieren negocio/presupuesto)

- **Apple Developer Program (99 USD/año):** necesario para builds `development`/`preview` de
  **iOS en dispositivo físico** y para publicar en App Store. La vía `development-simulator`
  no lo requiere, pero tampoco permite probar en un iPhone real ni distribuir a Cootrayal. Sin
  esta cuenta, iOS queda limitado a "compila y corre en simulador" indefinidamente.
- **Restricción del token público de Mapbox (`pk.`):** ya está en la checklist de seguridad de
  `docs/VoyYa/16-deploy.md` ("Restringir el token público de Mapbox (URL/scopes) + límite de
  uso"); queda pendiente decidir **qué restricción** (por bundle id/URL, por cuota) antes del
  piloto — es una decisión de `seguridad`, no de este runbook.
- **Publicar `@voyyaa/shared` como paquete privado:** mientras siga siendo `workspace:*`, el
  hook `eas-build-pre-install` para escribir el `NPM_TOKEN` en el `.npmrc` del runner de EAS
  (previsto en ADR-008 §3) sigue sin implementarse a propósito (sería código muerto hoy). Si
  se publica, hay que añadir ese hook y una variable EAS `NPM_TOKEN`.

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
> `pnpm -r typecheck` directo — `pnpm -r` no encadena scripts _distintos_ entre paquetes (no
> sabe que `typecheck` de `passenger` depende del `build` de `shared`/`ui-mobile`), así que sin
> Turbo fallaría en un clon nuevo con "Cannot find module '@voyya/shared'" hasta compilar sus
> `dist/` primero. Si prefieres comandos `pnpm -r` sueltos: `pnpm -r build && pnpm -r typecheck
&& pnpm -r lint` (mismo resultado, orden manual).

**Lo que este entorno NO puede verificar:** el render nativo (mapa, cámara, sensores) de
`passenger`/`driver` — requiere un dev-client o un dispositivo/emulador real (`expo start` +
Expo Go/dev client, o un build EAS instalado). El typecheck/lint sí cubre el código completo
(TS strict, sin `any`, ESLint) sin necesidad de ese entorno.

## Principios

TypeScript **strict** (sin `any` — regla dura vía ESLint `@typescript-eslint/no-explicit-any:
error`), SOLID/DRY/KISS, sin secretos versionados (`.env*` real está en `.gitignore`; solo
`.env.example` se versiona).
