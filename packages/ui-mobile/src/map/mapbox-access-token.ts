export interface MapboxTokenTarget {
  setAccessToken(token: string): unknown;
  setTelemetryEnabled(enabled: boolean): unknown;
}

export function createAccessTokenApplier(target: MapboxTokenTarget): (token: string) => void {
  let appliedToken: string | null = null;

  return (token) => {
    if (appliedToken === token) return;
    appliedToken = token;
    void target.setAccessToken(token);
    void target.setTelemetryEnabled(false);
  };
}
