export const DEFAULT_API_URL = 'http://localhost:3000';
export const DEV_API_PORT = 3000;

export interface ApiBaseUrlInputs {
  configuredUrl: string | undefined;
  metroHostUri: string | null | undefined;
  isDevelopment: boolean;
}

function hostFromHostUri(hostUri: string): string | null {
  const host = hostUri.replace(/^[a-z]+:\/\//i, '').split(/[/:]/)[0];
  return host && host.length > 0 ? host : null;
}

export function resolveApiBaseUrl(inputs: ApiBaseUrlInputs): string {
  const { configuredUrl, metroHostUri, isDevelopment } = inputs;
  if (configuredUrl && configuredUrl.length > 0) return configuredUrl;
  if (!isDevelopment || !metroHostUri) return DEFAULT_API_URL;
  const host = hostFromHostUri(metroHostUri);
  return host ? `http://${host}:${DEV_API_PORT}` : DEFAULT_API_URL;
}
