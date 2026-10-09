import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { driverChanged, driverIdentity } from './driver-change.ts';

const driver = (name: string, plate: string, companyId: number) => ({
  name,
  plate,
  model: null,
  contact_phone: null,
  eta: null,
  company: { company_id: companyId, display_name: 'Empresa' },
});

describe('driverChanged', () => {
  const base = driverIdentity(driver('María Gómez', 'ABC123', 1));

  it('is false for the first reading or when the driver is gone', () => {
    assert.equal(driverChanged(null, base), false);
    assert.equal(driverChanged(base, null), false);
  });

  it('is false for the same driver and company', () => {
    assert.equal(driverChanged(base, driverIdentity(driver('María Gómez', 'ABC123', 1))), false);
  });

  it('is true when the driver changes', () => {
    assert.equal(driverChanged(base, driverIdentity(driver('Luis Pérez', 'XYZ987', 1))), true);
  });

  it('is true when only the company changes', () => {
    assert.equal(driverChanged(base, driverIdentity(driver('María Gómez', 'ABC123', 2))), true);
  });
});
