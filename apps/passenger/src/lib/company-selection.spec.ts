import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ANY_COMPANY,
  companyLacksDrivers,
  companyPreference,
  findServiceOption,
  isPreferenceListed,
  requestedCompanyId,
  serviceOptionsStatus,
  sortCompanies,
} from './company-selection.ts';

const company = (id: number, name: string, drivers = true) => ({
  company_id: id,
  display_name: name,
  has_available_drivers: drivers,
});

const NORTE = company(2, 'Transportes del Norte', false);
const COOTRAYAL = company(1, 'Cootrayal');
const ALAMO = company(3, 'Álamo');

describe('serviceOptionsStatus', () => {
  it('is ready whenever data is in memory, even offline or after a failed refresh', () => {
    assert.equal(serviceOptionsStatus({ hasData: true, isError: true, offline: true }), 'ready');
  });

  it('is offline when it never loaded and there is no network', () => {
    assert.equal(
      serviceOptionsStatus({ hasData: false, isError: false, offline: true }),
      'offline',
    );
  });

  it('is error when it never loaded and the request failed', () => {
    assert.equal(serviceOptionsStatus({ hasData: false, isError: true, offline: false }), 'error');
  });

  it('is loading otherwise', () => {
    assert.equal(
      serviceOptionsStatus({ hasData: false, isError: false, offline: false }),
      'loading',
    );
  });
});

describe('sortCompanies', () => {
  it('orders from A to Z ignoring accents and does not mutate the input', () => {
    const input = [NORTE, COOTRAYAL, ALAMO];
    const sorted = sortCompanies(input);
    assert.deepEqual(
      sorted.map((c) => c.display_name),
      ['Álamo', 'Cootrayal', 'Transportes del Norte'],
    );
    assert.equal(input[0], NORTE);
  });

  it('breaks ties by id so the order is stable', () => {
    const sorted = sortCompanies([company(9, 'Taxis'), company(4, 'taxis')]);
    assert.deepEqual(
      sorted.map((c) => c.company_id),
      [4, 9],
    );
  });
});

describe('findServiceOption', () => {
  it('returns the taxi option or null', () => {
    const taxi = {
      service_type: 'taxi' as const,
      selection_required: false,
      companies: [COOTRAYAL],
    };
    assert.equal(findServiceOption([taxi], 'taxi'), taxi);
    assert.equal(findServiceOption([], 'taxi'), null);
  });
});

describe('requestedCompanyId', () => {
  const chosen = companyPreference(NORTE);

  it('sends the chosen company when the passenger had to choose', () => {
    assert.equal(requestedCompanyId(chosen, true), 2);
  });

  it('sends nothing for any company or when there is a single company', () => {
    assert.equal(requestedCompanyId(ANY_COMPANY, true), undefined);
    assert.equal(requestedCompanyId(chosen, false), undefined);
  });

  it('sends nothing for an undefined preference', () => {
    assert.equal(requestedCompanyId(null, true), undefined);
  });
});

describe('isPreferenceListed', () => {
  it('accepts any company and a listed company', () => {
    assert.equal(isPreferenceListed(ANY_COMPANY, []), true);
    assert.equal(isPreferenceListed(companyPreference(NORTE), [NORTE]), true);
  });

  it('rejects a company that left the list', () => {
    assert.equal(isPreferenceListed(companyPreference(NORTE), [COOTRAYAL]), false);
  });
});

describe('companyLacksDrivers', () => {
  it('is true only for a listed company flagged without drivers', () => {
    assert.equal(companyLacksDrivers(companyPreference(NORTE), [NORTE, COOTRAYAL]), true);
    assert.equal(companyLacksDrivers(companyPreference(COOTRAYAL), [NORTE, COOTRAYAL]), false);
    assert.equal(companyLacksDrivers(ANY_COMPANY, [NORTE]), false);
    assert.equal(companyLacksDrivers(null, [NORTE]), false);
    assert.equal(companyLacksDrivers(companyPreference(NORTE), []), false);
  });
});
