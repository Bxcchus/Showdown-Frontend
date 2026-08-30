const WATCHER_ORIGIN = "http://127.0.0.1:43991";
let localSessionToken: string | null = null;

export function clearWatcherSession() {
  localSessionToken = null;
}

type WatcherSessionResponse = { token: string };

async function createLocalSession() {
  const response = await fetch(`${WATCHER_ORIGIN}/v1/session`, {
    method: "POST",
    headers: { "X-Showdown-Pairing": "1" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Session locale du Watcher refusée.");
  const payload = (await response.json()) as WatcherSessionResponse;
  if (!payload.token) throw new Error("Session locale du Watcher invalide.");
  localSessionToken = payload.token;
  return payload.token;
}

export async function watcherFetch(
  path: string,
  init: RequestInit = {},
  requiresLocalSession = false,
) {
  const request = async (token?: string) =>
    fetch(`${WATCHER_ORIGIN}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        ...init.headers,
        ...(token ? { "X-Showdown-Watcher-Token": token } : {}),
      },
    });

  if (!requiresLocalSession) return request();
  let token = localSessionToken ?? (await createLocalSession());
  let response = await request(token);
  if (response.status === 401 || response.status === 403) {
    localSessionToken = null;
    token = await createLocalSession();
    response = await request(token);
  }
  return response;
}
