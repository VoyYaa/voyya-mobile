import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { BRAND_COLORS } from '../../palette.ts';

const appsRoot = new URL('../../../../../apps/', import.meta.url);
const read = (relative: string): string =>
  readFileSync(new URL(relative, appsRoot), 'utf8').replace(/\r\n/g, '\n');
const splashColor = (app: 'passenger' | 'driver'): string => {
  const config = JSON.parse(read(`${app}/app.json`)) as {
    expo: { splash: { backgroundColor: string } };
  };
  return config.expo.splash.backgroundColor;
};

describe('boot screen contract', () => {
  it('uses the same stage color in the native splash and in the boot screen of each app', () => {
    assert.equal(splashColor('passenger'), BRAND_COLORS.espresso);
    assert.equal(splashColor('driver'), BRAND_COLORS.amber);
    assert.match(read('passenger/app/_layout.tsx'), /stageColor=\{BRAND_COLORS\.espresso\}/);
    assert.match(read('driver/app/_layout.tsx'), /stageColor=\{BRAND_COLORS\.amber\}/);
  });

  it('boots the passenger as the taxi and the driver as the steering wheel', () => {
    assert.match(read('passenger/app/_layout.tsx'), /target="taxi"/);
    assert.match(read('driver/app/_layout.tsx'), /target="wheel"/);
  });

  it('draws the ring of the driver in espresso and never in green', () => {
    const driver = read('driver/app/_layout.tsx');
    assert.match(driver, /ringColor=\{BRAND_COLORS\.espresso\}/);
    assert.doesNotMatch(driver, /ringColor=\{BRAND_COLORS\.go\}/);
  });

  it('keeps the status bar of the driver dark while booting', () => {
    assert.match(read('driver/app/_layout.tsx'), /style=\{!bootDone \|\| theme\.mode === 'light'/);
  });

  it('does not use the retired figures anywhere', () => {
    for (const file of [
      'passenger/app/_layout.tsx',
      'driver/app/_layout.tsx',
      'passenger/src/components/SearchRadar.tsx',
    ]) {
      assert.doesNotMatch(read(file), /target="(person|car)"/);
    }
  });
});
