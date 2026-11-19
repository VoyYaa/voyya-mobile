import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const apps = ['passenger', 'driver'];
const profiles = ['development', 'preview', 'production'];

const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));

const packageManager = readJson('package.json').packageManager ?? '';
const expected = packageManager.startsWith('pnpm@') ? packageManager.slice('pnpm@'.length) : null;

if (expected === null) {
  console.error(`package.json packageManager must be "pnpm@<version>", found "${packageManager}"`);
  process.exit(1);
}

const mismatches = apps.flatMap((app) => {
  const build = readJson(`apps/${app}/eas.json`).build ?? {};
  return profiles
    .filter((profile) => build[profile]?.pnpm !== expected)
    .map((profile) => `apps/${app}/eas.json build.${profile}.pnpm is "${build[profile]?.pnpm}"`);
});

if (mismatches.length > 0) {
  console.error(`EAS pnpm version must equal packageManager (${expected}):`);
  mismatches.forEach((line) => console.error(`  ${line}`));
  process.exit(1);
}

console.log(`EAS pnpm version matches packageManager: ${expected}`);
