# Security exceptions — dependency audit

CI runs `pnpm audit --prod --audit-level high` and fails on any High or Critical advisory that is not
listed here. The same list lives in `package.json` under `pnpm.auditConfig.ignoreGhsas`; the two must
change together. Nothing else is silenced: every other advisory still fails the build.

Origin: `docs/security/reporte-cierre-mvp.md` (CM-02, G-03). Baseline before the fix: 1 Critical and 28
High. After the fix: 0 unignored Critical or High.

## Fixed by overrides (`package.json` → `pnpm.overrides`)

| Package                                     | Change           | Why it is safe                                                                                                 |
| ------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| `postcss`                                   | 8.4.49 → ^8.5.18 | Same major. Used by `@expo/metro-config`; `expo export` verified for both apps and both targets.               |
| `@xmldom/xmldom` (only under `@expo/plist`) | 0.7.13 → ^0.8.15 | Used when generating native config. `expo prebuild --platform android` and `@expo/plist` parse/build verified. |

## Open exceptions

All affect the Expo/Metro build toolchain that runs on developer machines and EAS build workers, never
inside the shipped app bundle. Packages are parsed from the dependency graph of `expo`, `expo-router` and
`react-native`, which pnpm classifies as production dependencies, so `--prod` cannot exclude them.

| Package              | GHSA                                                                                                                                                                   | Severity | Blocker                                                                                                                                                                                                              | Exposure                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `tar` 6.2.1          | GHSA-23hp-3jrh-7fpw                                                                                                                                                    | Critical | Fix is 7.5.19+. Tried the override: `@expo/cli` (SDK 51) uses `import tar from 'tar'`, which tar 7 does not provide; `expo prebuild` fails with `Cannot read properties of undefined (reading 'extract')`. Reverted. | Extracts only the Expo project template tarball from the npm registry during `expo prebuild`. No untrusted archives. |
| `tar` 6.2.1          | GHSA-34x7-hfp2-rc4v, GHSA-8qq5-rm4j-mr97, GHSA-83g3-92jg-28cx, GHSA-qffp-2rhf-9h96, GHSA-9ppj-qmqm-q256, GHSA-r6q2-hw4h-h46w, GHSA-8x88-c5mf-7j5w, GHSA-r292-9mhp-454m | High     | Same as above.                                                                                                                                                                                                       | Same as above.                                                                                                       |
| `image-size` 1.2.1   | GHSA-5p2g-fcmc-qvqq, GHSA-w3rx-r6r6-pgpr                                                                                                                               | High     | Fix is 2.0.3+ (new major). Metro 0.80 in React Native 0.74 depends on the 1.x API.                                                                                                                                   | Reads image dimensions of the repository's own assets during bundling.                                               |
| `node-forge` 1.4.0   | GHSA-86w9-cpqp-85rv                                                                                                                                                    | High     | No patched version published.                                                                                                                                                                                        | Dev-server HTTPS certificate generation in `@expo/cli`. Not used by the app or by EAS builds.                        |
| `braces` 3.0.3       | GHSA-vfj7-8cjw-p6xm                                                                                                                                                    | High     | No patched version published.                                                                                                                                                                                        | Glob expansion of repository paths in `@expo/cli`. No attacker-controlled patterns.                                  |
| `turbo-stream` 2.4.1 | GHSA-rxv8-25v2-qmq8                                                                                                                                                    | High     | Fix is 3.0.0+ (new major) pulled by `@expo/server`.                                                                                                                                                                  | Only used by Expo Router server output. Both apps use `web.output: single` and ship no server runtime.               |

## Review

- Next review: 2026-11-08, or earlier if Expo SDK 52+ is adopted (it moves `@expo/cli`, Metro and
  `expo-router` to patched majors and should remove most entries).
- On every review: drop an entry as soon as a compatible patch exists, then run `pnpm audit --prod
--audit-level high` with the ignore list empty to confirm what remains.
- Runtime dependencies of the shipped app (`react`, `zustand`, `@tanstack/react-query`, `zod`, Expo
  runtime modules) currently have no High or Critical findings.
