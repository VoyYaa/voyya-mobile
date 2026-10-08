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
pnpm --filter @voyyaa/passenger start                  # o: cd apps/passenger && pnpm start

# Conductor
pnpm --filter @voyyaa/driver start
```

Esto levanta Metro con `expo start --dev-client` y un QR para abrir en la **development build** de VoyYa
(ver "Probar en un teléfono físico"). **Expo Go ya no es una vía soportada**: `@rnmapbox/maps` es un
módulo nativo que Expo Go no trae, y el Expo Go de la App Store de iOS solo abre el SDK más reciente
(estas apps son SDK 51).

Antes de correr `start`, si tocaste `packages/shared` o `packages/ui-mobile`, constrúyelos
primero (los apps consumen su `dist/` compilado, no el código fuente directamente):

```bash
pnpm --filter @voyya/shared --filter @voyya/ui-mobile build
```

## Probar en un teléfono físico

Las apps usan módulos nativos (Mapbox, ubicación, notificaciones), así que corren en una
**development build**: un APK (Android) o IPA (iPhone) con `expo-dev-client` que, en vez de traer el
JavaScript adentro, lo descarga de Metro en tu PC. La build se instala **una sola vez**; el código del
día a día se recarga desde Metro sin recompilar. Solo hay que recompilar si cambian dependencias
nativas, plugins de `app.json` o el SDK.

Son **dos apps y dos proyectos EAS** (`apps/passenger`, `apps/driver`): repite cada paso para la que
vayas a probar. Puertos de Metro: pasajero 8081, conductor 8082.

### 0. Una sola vez

1. Cuenta Expo con acceso al owner `voyya` (el `owner` de ambos `app.json`): `npx eas-cli login`.
   Comprueba con `npx eas-cli whoami`. Los dos proyectos EAS ya tienen `projectId` en `app.json`.
2. Secretos en EAS (nombres; los valores los pones tú, **nunca** en el repo):

   | Nombre                         | Tipo                             | Para qué                                                                                                                            |
   | ------------------------------ | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
   | `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` | secreto `sk.` (`DOWNLOADS:READ`) | Descarga del SDK nativo de Mapbox al compilar. Obligatorio en **iOS** (CocoaPods); opcional en Android. Sin él, la build iOS falla. |
   | `EXPO_PUBLIC_MAPBOX_TOKEN`     | texto plano `pk.`                | Token público del mapa. En una dev build lo lee **Metro** (paso 3.4), no la build; en `preview`/`production` sí viene de EAS.       |

   Desde `apps/passenger` y luego desde `apps/driver` (sin `--value` el CLI pregunta el valor y no queda en
   el historial de la terminal):

   ```bash
   npx eas-cli env:create --scope project --name RNMAPBOX_MAPS_DOWNLOAD_TOKEN --environment development,preview,production --visibility secret
   npx eas-cli env:create --scope project --name EXPO_PUBLIC_MAPBOX_TOKEN --environment development,preview,production --visibility plaintext
   ```

   El plugin de `@rnmapbox/maps` 10.2.10 lee `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` del entorno de la build en iOS
   (podspec) y en Android (Gradle): no hay que tocar `app.json`.

`EXPO_PUBLIC_API_URL` **no** va en EAS para desarrollo: el perfil `development` no la define a propósito.

### 1. Android

1. Compila la development build en la nube (no necesita Android Studio):

   ```bash
   cd apps/passenger
   npx eas-cli build --platform android --profile development
   ```

2. Al terminar, EAS imprime un enlace y un QR. Ábrelo **en el teléfono**, descarga el `.apk` e instálalo
   (Android pedirá permitir "instalar apps desconocidas" para el navegador).
3. Repite en `apps/driver` si vas a probar el conductor. Cada app se instala por separado.

Build local (opcional): requiere JDK 17, Android SDK con `ANDROID_HOME` y `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` en
el entorno, y **Linux, macOS o WSL** (`eas build --local` no corre en Windows nativo). El PC de desarrollo
actual no tiene JDK ni Android SDK: usa la nube.

### 2. iPhone

Requisitos: **Apple Developer Program** (99 USD/año) y el iPhone con **Modo de desarrollador** activado
(Ajustes > Privacidad y seguridad > Modo de desarrollador; el iPhone se reinicia).

1. Registra el iPhone en el perfil ad hoc. El comando da un enlace y un QR que se abren **en el iPhone**,
   instalan un perfil de configuración y registran su UDID:

   ```bash
   npx eas-cli device:create
   ```

2. Compila para dispositivo (el perfil `development` tiene `ios.simulator: false` y distribución interna):

   ```bash
   cd apps/passenger
   npx eas-cli build --platform ios --profile development
   ```

   La primera vez pide el login de Apple y deja que EAS administre certificados y perfil de provisión. Si
   registras otro iPhone **después** de una build, hay que recompilar: el perfil ad hoc lista los UDID que
   existían al compilar.

3. Instala desde el enlace o QR que imprime EAS, abierto en el iPhone. Si iOS dice "desarrollador no
   confiable": Ajustes > General > VPN y administración de dispositivos > confiar.
4. Repite en `apps/driver` para el conductor.

`development-simulator` (simulador de iOS) existe, pero necesita un Mac; no sirve para tu iPhone.

Notificaciones push del conductor: en iOS el entitlement de APNs lo gestiona EAS con tu cuenta Apple; en
Android hacen falta credenciales FCM (`google-services.json` y clave FCM v1 en EAS). Sin eso la app corre y
solo registra un aviso: no impide probar el resto.

### 3. Arrancar Metro y escanear

1. En VS Code, tarea **"4a · Pasajero: Metro (:8081, IP de LAN)"** (o **4b** para el conductor). Detecta sola
   la IP de tu interfaz física (Ethernet o Wi-Fi), la usa para el QR y arranca `expo start --dev-client`.
   A mano, desde la raíz: `powershell -File infra/scripts/start-dev-client.ps1 -App passenger -Port 8081`.
   Si el QR dice `127.0.0.1`, Metro arrancó sin la IP de LAN y el teléfono no lo alcanzará.
2. **El teléfono y el PC deben estar en la misma red**, sin "aislamiento de clientes" en el router. El
   firewall de Windows debe permitir Node de entrada (puertos 8081 y 8082).
3. Abre la app **VoyYa de desarrollo ya instalada** (no Expo Go) y usa **Scan QR code**, o toca la URL que
   aparece en "Development servers". En Android también sirve escanear el QR con la cámara. Si no conecta,
   ejecuta la tarea **"Diagnostico: mi IP de LAN y puertos de Metro"**.
4. Para el mapa, pon `EXPO_PUBLIC_MAPBOX_TOKEN=pk....` en `apps/<app>/.env` antes de arrancar Metro (Metro
   lee el `.env` de la carpeta de la app que arranca) y reinicia Metro si lo cambias.

### 4. API local accesible desde el teléfono

- La API corre en el PC en el puerto **3000** (tarea "2 · API: dev (:3000)"; escucha en todas las
  interfaces).
- **No hay IP que configurar.** En desarrollo, si `EXPO_PUBLIC_API_URL` no está definida, la app toma el host
  desde el que Metro la sirvió y usa `http://<esa IP>:3000` (`resolveApiBaseUrl`, `packages/app-runtime`). Si
  cambias de red, reinicia Metro: la IP se recalcula sola.
- Para apuntar a otra API (p. ej. Railway), define `EXPO_PUBLIC_API_URL` en `apps/<app>/.env` y reinicia
  Metro. Una variable definida siempre gana a la derivada.
- Prueba desde el navegador del teléfono: `http://<IP del PC>:3000/health/db` debe responder. Si no, es red
  o firewall (puerto 3000), no la app.
- Con `--tunnel` el host no es una IP de LAN y la derivación no sirve: define `EXPO_PUBLIC_API_URL`.
- Fuera de desarrollo (`preview`, `production`) no se deriva nada: la URL viene de `eas.json`.

## Probar en navegador (web) — solo para desarrollo, nunca se publica

En esta máquina el registro de npm corporativo bloquea instalar `eas-cli`, nunca se corrió
`eas build`, y un build de iOS para dispositivo físico exige Apple Developer Program (cuenta de
pago). **Web es la única vía disponible para probar los flujos sin EAS, sin QR y sin
dispositivo.** Ninguna de las dos apps se va a publicar en web — es exclusivamente un entorno de
prueba local.

```bash
pnpm add -D react-dom react-native-web --filter @voyya/passenger --filter @voyya/driver
pnpm --filter @voyya/passenger start -- --web   # o: cd apps/passenger && pnpm exec expo start --web
```

**El mapa no funciona en web y no se espera que funcione:** `isNativeMapAvailable()`
(`packages/ui-mobile/src/map/mapbox-env.ts`) detecta `Platform.OS === 'web'` y degrada siempre a
`MapFallback`, igual que ya hacía en Expo Go. Además, `packages/ui-mobile/src/map/NativeMap.web.tsx`
reemplaza en el bundle web a `NativeMap.tsx` (que importa `@rnmapbox/maps` de forma estática) — sin
ese archivo hermano, Metro intenta resolver `@rnmapbox/maps` para la plataforma web, que a su vez
importa `mapbox-gl` (peer dependency opcional, no instalada) y **rompe el bundle antes de llegar a
ejecutar nada** (confirmado: no es solo una sospecha de un ciclo anterior, se probó en esta tarea).
Un `require`/`import()` diferido dentro de `Map.tsx` **no habría bastado**: Metro resuelve el grafo
de módulos de forma estática en tiempo de bundling, independientemente de si el `require` está
detrás de una condición o se ejecuta más tarde — solo la resolución **por plataforma** de Metro
(sufijo `.web.tsx` / `.native.tsx`, el mismo mecanismo que usa `@rnmapbox/maps` internamente) evita
que el árbol de `@rnmapbox/maps` se toque siquiera al empaquetar para web.

**La sesión NO se persiste entre recargas en web — es una decisión deliberada, no un bug.**
`expo-secure-store` no tiene almacenamiento seguro real en web (su build web es un stub vacío que
revienta al llamar `getItemAsync`/`setItemAsync`). En vez de caer en el patrón común de "guardar el
refresh token en `localStorage`", `packages/app-runtime/src/session/dev-only/web-secure-storage.adapter.ts`
(nombre y carpeta `dev-only/` explícitos a propósito) **no persiste nada**: `getItem` siempre
devuelve `null`, `setItem`/`deleteItem` son no-op. La sesión vive únicamente en memoria (el store de
Zustand) mientras la pestaña sigue abierta — funciona igual durante toda la navegación, incluido el
refresco silencioso del token — pero **recargar la página equivale a cerrar sesión**. Se eligió
esto en vez de usar `sessionStorage`/`localStorage` con el refresh token (u otro subconjunto de la
sesión) porque cualquier dato de sesión escrito en Web Storage es legible por un XSS; no persistir
nada reduce esa superficie a cero al costo de comodidad (relogin en cada F5), aceptable porque web
aquí es solo un arnés de pruebas, no un canal de distribución. El adaptador nativo
(`expo-secure-store`, keychain/keystore) sigue siendo el default en iOS/Android — no cambió.
El puerto se resuelve automáticamente por `Platform.OS`
(`packages/app-runtime/src/session/secure-storage-port.ts`); `setSecureStoragePort()` queda
disponible para forzar un adaptador distinto (tests, por ejemplo).

## Variables de entorno móvil

Cada app trae su `.env.example`. Expo solo expone al bundle del cliente las variables con
prefijo `EXPO_PUBLIC_*` (inyectadas en **build-time**, no en runtime — cualquier cambio exige
reiniciar el bundler / rehacer el build).

| Variable                   | App               | Descripción                                                                   |
| -------------------------- | ----------------- | ----------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`      | passenger, driver | URL base del backend. En desarrollo es opcional: se deriva del host de Metro. |
| `EXPO_PUBLIC_MAPBOX_TOKEN` | passenger, driver | Token **público** de Mapbox (prefijo `pk.`) para `@rnmapbox/maps` 10.2.x.     |

**Nota importante sobre Mapbox:** el "download token" (`sk.…`, scope `DOWNLOADS:READ`) es un secreto de
**build**, no de runtime: `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` en el entorno de la build lo recogen solos el podspec
de iOS (obligatorio para descargar el SDK nativo) y el Gradle de Android (opcional). Va como secreto de EAS
y **nunca** en el repo ni en `.env`. El único token que consume la app en tiempo de ejecución es el público
`pk.…`, vía `EXPO_PUBLIC_MAPBOX_TOKEN` (ver `packages/ui-mobile/src/map/mapbox-env.ts`).

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
      de `@rnmapbox/maps` en `packages/ui-mobile/src/map/NativeMap.tsx` (`Map.tsx` solo evita
      **renderizarlo** vía `isNativeMapAvailable()`, no evita que Metro lo empaquete — en un
      dev-client/APK real el módulo nativo sí está compilado, así que en teoría no debería
      fallar, pero nunca se ha ejecutado). Confirmado en la tarea de habilitar `--web`: el
      import estático **sí** rompe el bundle cuando la plataforma no trae el módulo nativo (en
      web, Metro sigue el `import` de `@rnmapbox/maps` hasta `mapbox-gl`, que no está instalado,
      y el bundling falla) — se resolvió ahí con `NativeMap.web.tsx` (resolución por plataforma
      de Metro, no con un `require` diferido: un lazy import no habría evitado que Metro
      resolviera el grafo en tiempo de bundling). El bundle **nativo** (`?platform=ios`) se
      verificó sin cambios en esa misma tarea (HTTP 200, tamaño estable) para `passenger` y
      `driver`; sigue pendiente solo la ejecución real en un dispositivo/simulador.
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
pnpm run format:check # prettier --check sobre todo el repo
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
(TS strict, sin `any`, ESLint) sin necesidad de ese entorno. **Web** (ver sección de arriba)
permite probar los flujos de UI/navegación/estado sin EAS ni dispositivo, pero tampoco es
render nativo real: el mapa siempre cae al fallback y la sesión no sobrevive un refresh — son
las dos limitaciones aceptadas de usar web como arnés de pruebas, no como plataforma objetivo.

## Principios

TypeScript **strict** (sin `any` — regla dura vía ESLint `@typescript-eslint/no-explicit-any:
error`), SOLID/DRY/KISS, sin secretos versionados (`.env*` real está en `.gitignore`; solo
`.env.example` se versiona).
