const requestForegroundPermissionsAsync = jest.fn();
const hasServicesEnabledAsync = jest.fn();
const getLastKnownPositionAsync = jest.fn();
const getCurrentPositionAsync = jest.fn();

jest.mock(
  'expo-location',
  () => ({
    requestForegroundPermissionsAsync,
    hasServicesEnabledAsync,
    getLastKnownPositionAsync,
    getCurrentPositionAsync,
    Accuracy: { Balanced: 3 },
  }),
  { virtual: true },
);

import { expoDeviceLocationPort } from './device-location-port';

const YARUMAL_LAT = 6.9591;
const YARUMAL_LNG = -75.4181;
const OUTSIDE_COLOMBIA_LAT = 37.422;
const OUTSIDE_COLOMBIA_LNG = -122.084;

function position(lat: number, lng: number) {
  return { coords: { latitude: lat, longitude: lng } };
}

describe('expoDeviceLocationPort (ADR-019 §9.7.10)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted', canAskAgain: true });
    hasServicesEnabledAsync.mockResolvedValue(true);
    getLastKnownPositionAsync.mockResolvedValue(null);
    getCurrentPositionAsync.mockResolvedValue(position(YARUMAL_LAT, YARUMAL_LNG));
  });

  it('permission denied, can ask again -> permission_denied with canAskAgain true', async () => {
    requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied', canAskAgain: true });

    const outcome = await expoDeviceLocationPort.requestLocation({ timeoutMs: 1000 });

    expect(outcome).toEqual({ kind: 'permission_denied', canAskAgain: true });
    expect(hasServicesEnabledAsync).not.toHaveBeenCalled();
  });

  it('permission denied, cannot ask again -> permission_denied with canAskAgain false', async () => {
    requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied', canAskAgain: false });

    const outcome = await expoDeviceLocationPort.requestLocation({ timeoutMs: 1000 });

    expect(outcome).toEqual({ kind: 'permission_denied', canAskAgain: false });
  });

  it('OS location services disabled -> unavailable with reason services_disabled', async () => {
    hasServicesEnabledAsync.mockResolvedValue(false);

    const outcome = await expoDeviceLocationPort.requestLocation({ timeoutMs: 1000 });

    expect(outcome).toEqual({ kind: 'unavailable', reason: 'services_disabled' });
    expect(getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('a valid cached position within the accuracy budget is used without calling getCurrentPositionAsync', async () => {
    getLastKnownPositionAsync.mockResolvedValue(position(YARUMAL_LAT, YARUMAL_LNG));

    const outcome = await expoDeviceLocationPort.requestLocation({ timeoutMs: 1000 });

    expect(outcome).toEqual({
      kind: 'granted',
      coordinate: { lat: YARUMAL_LAT, lng: YARUMAL_LNG },
    });
    expect(getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('a cached position rejected by accuracy falls through to a fresh reading', async () => {
    getLastKnownPositionAsync.mockResolvedValue(null);
    getCurrentPositionAsync.mockResolvedValue(position(YARUMAL_LAT, YARUMAL_LNG));

    const outcome = await expoDeviceLocationPort.requestLocation({ timeoutMs: 1000 });

    expect(getLastKnownPositionAsync).toHaveBeenCalledWith(
      expect.objectContaining({ maxAge: expect.any(Number), requiredAccuracy: expect.any(Number) }),
    );
    expect(getCurrentPositionAsync).toHaveBeenCalledTimes(1);
    expect(outcome).toEqual({
      kind: 'granted',
      coordinate: { lat: YARUMAL_LAT, lng: YARUMAL_LNG },
    });
  });

  it('the wait for a fresh reading times out -> unavailable with reason timeout', async () => {
    getLastKnownPositionAsync.mockResolvedValue(null);
    getCurrentPositionAsync.mockImplementation(() => new Promise(() => {}));

    const outcome = await expoDeviceLocationPort.requestLocation({ timeoutMs: 20 });

    expect(outcome).toEqual({ kind: 'unavailable', reason: 'timeout' });
  });

  it('a fresh coordinate outside Colombia is rejected -> unavailable, never granted', async () => {
    getLastKnownPositionAsync.mockResolvedValue(null);
    getCurrentPositionAsync.mockResolvedValue(position(OUTSIDE_COLOMBIA_LAT, OUTSIDE_COLOMBIA_LNG));

    const outcome = await expoDeviceLocationPort.requestLocation({ timeoutMs: 1000 });

    expect(outcome).toEqual({ kind: 'unavailable', reason: 'position_unavailable' });
  });

  it('the SDK throwing inside the read -> unavailable with reason position_unavailable', async () => {
    getLastKnownPositionAsync.mockResolvedValue(null);
    getCurrentPositionAsync.mockRejectedValue(new Error('native module crashed'));

    const outcome = await expoDeviceLocationPort.requestLocation({ timeoutMs: 1000 });

    expect(outcome).toEqual({ kind: 'unavailable', reason: 'position_unavailable' });
  });

  it('a cached coordinate outside Colombia is also rejected -> unavailable, never granted', async () => {
    getLastKnownPositionAsync.mockResolvedValue(position(OUTSIDE_COLOMBIA_LAT, OUTSIDE_COLOMBIA_LNG));

    const outcome = await expoDeviceLocationPort.requestLocation({ timeoutMs: 1000 });

    expect(outcome).toEqual({ kind: 'unavailable', reason: 'position_unavailable' });
    expect(getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('a granted reading inside Colombia returns the parsed coordinate', async () => {
    getLastKnownPositionAsync.mockResolvedValue(null);
    getCurrentPositionAsync.mockResolvedValue(position(YARUMAL_LAT, YARUMAL_LNG));

    const outcome = await expoDeviceLocationPort.requestLocation({ timeoutMs: 1000 });

    expect(outcome.kind).toBe('granted');
    if (outcome.kind === 'granted') {
      expect(outcome.coordinate).toEqual({ lat: YARUMAL_LAT, lng: YARUMAL_LNG });
    }
  });
});
