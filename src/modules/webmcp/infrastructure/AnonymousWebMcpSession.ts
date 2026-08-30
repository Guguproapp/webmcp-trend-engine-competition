const SESSION_KEY = 'trend-engine.webmcp.anonymous-session.v1';

export function getOrCreateAnonymousSessionId(storage: Pick<Storage, 'getItem' | 'setItem'> = window.sessionStorage) {
  const existing = storage.getItem(SESSION_KEY);
  if (existing && /^[a-f0-9-]{16,64}$/iu.test(existing)) return existing;
  const created = crypto.randomUUID(); storage.setItem(SESSION_KEY, created); return created;
}
