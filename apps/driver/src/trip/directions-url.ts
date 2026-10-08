export type DirectionsPlatform = 'ios' | 'android' | 'web';

export function buildDirectionsUrl(
  address: string,
  municipality: string | null,
  platform: DirectionsPlatform,
): string {
  const query = encodeURIComponent(municipality ? `${address}, ${municipality}` : address);
  if (platform === 'android') return `geo:0,0?q=${query}`;
  if (platform === 'ios') return `maps:?q=${query}`;
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
