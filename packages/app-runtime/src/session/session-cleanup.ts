type SessionClearedHandler = () => void | Promise<void>;

const handlers = new Set<SessionClearedHandler>();

export function onSessionCleared(handler: SessionClearedHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export async function runSessionClearedHandlers(): Promise<void> {
  await Promise.allSettled([...handlers].map((handler) => handler()));
}
