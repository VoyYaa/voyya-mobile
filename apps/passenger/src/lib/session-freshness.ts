export function isSessionFresh(dataUpdatedAt: number, sessionStartedAt: number | null): boolean {
  return sessionStartedAt !== null && dataUpdatedAt > 0 && dataUpdatedAt >= sessionStartedAt;
}
