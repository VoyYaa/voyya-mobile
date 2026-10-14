export interface LogoutFlowDeps {
  waitForSessionRefresh: () => Promise<void>;
  quiescePush: () => Promise<void>;
  readRefreshToken: () => string | null;
  revokePushToken: () => Promise<unknown>;
  requestLogout: (refreshToken: string) => Promise<unknown>;
  forgetPushToken: () => Promise<void>;
  dismissAllNotifications: () => Promise<void>;
  clearSession: () => Promise<void>;
}

function ignoreFailure(): void {
  return undefined;
}

export async function runLogoutFlow(deps: LogoutFlowDeps): Promise<void> {
  await deps.waitForSessionRefresh();
  await deps.quiescePush().catch(ignoreFailure);
  const refreshToken = deps.readRefreshToken();
  try {
    await deps.revokePushToken().catch(ignoreFailure);
    if (refreshToken) {
      await deps.requestLogout(refreshToken);
    }
  } finally {
    await deps.forgetPushToken().catch(ignoreFailure);
    await deps.dismissAllNotifications().catch(ignoreFailure);
    await deps.clearSession();
  }
}
