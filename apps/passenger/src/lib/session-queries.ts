export interface SessionQueryScope {
  authenticated: boolean;
  userId: number | null;
}

export function shouldPurgeSessionQueries(
  previous: SessionQueryScope,
  next: SessionQueryScope,
): boolean {
  return previous.authenticated && (!next.authenticated || previous.userId !== next.userId);
}
