"use client";

const CLIENT_ID = "pinkward-web";
export const PUBLIC_SCOPES =
  "openid profile:read profile:write party:manage queue:write match:read match:ready";
const SESSION_KEY = "pinkward.oauth.access";
const FLOW_KEY = "pinkward.oauth.flow";
const LOGOUT_KEY = "pinkward.oauth.logout";
const SESSION_INVALIDATED_EVENT = "pinkward:session-invalidated";
const SESSION_REQUEST_TIMEOUT_MS = 12_000;

type TokenResponse = { access_token: string; expires_in: number };
type TokenClaims = {
  sub: string;
  preferred_username?: string;
  scope?: string[] | string;
};
type AuthorizationFlow = {
  state: string;
  verifier: string;
  redirectUri: string;
};

export type UserSession = {
  accessToken: string;
  expiresAt: number;
  playerId: string;
  username: string;
};

let inMemorySession: UserSession | null = null;
let loginCompletionInFlight: Promise<UserSession | null> | null = null;
let refreshInFlight: Promise<UserSession | null> | null = null;
let signOutInFlight: Promise<void> | null = null;
let authEpoch = 0;

function storageGet(storage: Storage, key: string) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    /* Private browsing and hardened browsers may disable Web Storage. */
  }
}

function storageRemove(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    /* Session invalidation must not depend on Web Storage availability. */
  }
}

function logoutRequested() {
  return Boolean(storageGet(localStorage, LOGOUT_KEY));
}

export class SessionRefreshError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "SessionRefreshError";
  }
}

class SessionRequestTimeoutError extends Error {
  constructor() {
    super("La préparation de la session a dépassé le délai autorisé.");
    this.name = "SessionRequestTimeoutError";
  }
}

async function sessionFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = new Promise<never>((_, reject) => {
    const timer = window.setTimeout(() => {
      controller.abort();
      reject(new SessionRequestTimeoutError());
    }, SESSION_REQUEST_TIMEOUT_MS);
    controller.signal.addEventListener(
      "abort",
      () => window.clearTimeout(timer),
      { once: true },
    );
  });
  try {
    return await Promise.race([
      fetch(input, { ...init, signal: controller.signal }),
      timeout,
    ]);
  } finally {
    controller.abort();
  }
}

export const apiPath = (path: string) => `/backend${path}`;

export function backendOrigin() {
  const configured = process.env.NEXT_PUBLIC_PINKWARD_IDENTITY_ORIGIN;
  if (configured) return configured.replace(/\/$/, "");
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  )
    return "http://localhost:8088";
  throw new Error(
    "Le domaine HTTPS de l’API GYMS.LOL doit être configuré avant la connexion publique.",
  );
}

export function websocketOrigin() {
  const configured = process.env.NEXT_PUBLIC_PINKWARD_WEBSOCKET_ORIGIN;
  return (configured || backendOrigin()).replace(/^http/, "ws");
}

function randomUrlSafe(bytes: number) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return base64Url(value);
}

function base64Url(value: Uint8Array) {
  let binary = "";
  value.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function codeChallenge(verifier: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return base64Url(new Uint8Array(digest));
}

function decodeClaims(token: string): TokenClaims {
  const payload = token
    .split(".")[1]
    ?.replaceAll("-", "+")
    .replaceAll("_", "/");
  if (!payload) throw new Error("Jeton d’accès invalide.");
  return JSON.parse(
    atob(payload + "=".repeat((4 - (payload.length % 4)) % 4)),
  ) as TokenClaims;
}

function hasRequiredScopes(token: string) {
  const claim = decodeClaims(token).scope;
  const granted = new Set(
    Array.isArray(claim) ? claim : (claim ?? "").split(/\s+/).filter(Boolean),
  );
  return PUBLIC_SCOPES.split(" ").every((scope) => granted.has(scope));
}

function saveAccessSession(tokens: TokenResponse) {
  const claims = decodeClaims(tokens.access_token);
  const session: UserSession = {
    accessToken: tokens.access_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    playerId: claims.sub,
    username: claims.preferred_username ?? "Joueur GYMS.LOL",
  };
  // Les jetons ne sont jamais persistés dans un stockage lisible par le DOM.
  // Le rafraîchissement reste dans un cookie HttpOnly géré par le BFF.
  inMemorySession = session;
  storageRemove(sessionStorage, SESSION_KEY);
  return session;
}

function invalidateLocalSession(broadcast = true) {
  authEpoch += 1;
  inMemorySession = null;
  storageRemove(sessionStorage, SESSION_KEY);
  storageRemove(sessionStorage, FLOW_KEY);
  if (broadcast) storageSet(localStorage, LOGOUT_KEY, String(Date.now()));
  window.dispatchEvent(new Event(SESSION_INVALIDATED_EVENT));
}

export function readSession(): UserSession | null {
  // Nettoie une éventuelle session héritée des anciennes versions du client.
  storageRemove(sessionStorage, SESSION_KEY);
  if (!inMemorySession) return null;
  try {
    if (!hasRequiredScopes(inMemorySession.accessToken))
      throw new Error("Portée OAuth2 incomplète.");
    return inMemorySession;
  } catch {
    inMemorySession = null;
    return null;
  }
}

export async function beginLogin(forceConsent = false) {
  storageRemove(localStorage, LOGOUT_KEY);
  const verifier = randomUrlSafe(64);
  const flow: AuthorizationFlow = {
    state: randomUrlSafe(32),
    verifier,
    redirectUri: `${window.location.origin}/oauth/callback`,
  };
  storageSet(sessionStorage, FLOW_KEY, JSON.stringify(flow));
  const parameters = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: PUBLIC_SCOPES,
    redirect_uri: flow.redirectUri,
    state: flow.state,
    code_challenge: await codeChallenge(verifier),
    code_challenge_method: "S256",
  });
  if (forceConsent) parameters.set("prompt", "consent");
  window.location.assign(`${backendOrigin()}/oauth2/authorize?${parameters}`);
}

async function completeAuthorizationCode(): Promise<UserSession | null> {
  const query = new URLSearchParams(window.location.search);
  if (query.get("error"))
    throw new Error(
      query.get("error_description") ??
        query.get("error") ??
        "Connexion refusée",
    );
  const serialized = storageGet(sessionStorage, FLOW_KEY);
  const code = query.get("code");
  const state = query.get("state");
  if (!serialized || !code || !state)
    throw new Error("Réponse OAuth2 incomplète.");
  const flow = JSON.parse(serialized) as AuthorizationFlow;
  if (state !== flow.state) throw new Error("État OAuth2 invalide.");
  let response: Response;
  try {
    response = await sessionFetch("/api/session/token", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        verifier: flow.verifier,
        redirectUri: flow.redirectUri,
      }),
    });
  } catch {
    storageRemove(sessionStorage, FLOW_KEY);
    window.history.replaceState({}, "", "/");
    throw new Error(
      "La connexion a pris trop de temps. Relance-la depuis GYMS.LOL.",
    );
  }
  if (!response.ok) {
    storageRemove(sessionStorage, FLOW_KEY);
    window.history.replaceState({}, "", "/");
    throw new Error("Échange du code OAuth2 refusé.");
  }
  storageRemove(sessionStorage, FLOW_KEY);
  storageRemove(localStorage, LOGOUT_KEY);
  const session = saveAccessSession((await response.json()) as TokenResponse);
  window.history.replaceState({}, "", "/");
  return session;
}

export function completeLogin(): Promise<UserSession | null> {
  if (window.location.pathname !== "/oauth/callback") {
    // Keep the public contract stable even when a previous logout marker is
    // present. BackendProvider chains this result with `.then(...)`; returning
    // a bare null here caused the application to crash during anonymous boot.
    if (logoutRequested()) return Promise.resolve(null);
    return Promise.resolve(readSession()).then(
      (session) => session ?? refreshSession(),
    );
  }
  if (loginCompletionInFlight) return loginCompletionInFlight;
  const operation = completeAuthorizationCode();
  const tracked = operation.finally(() => {
    if (loginCompletionInFlight === tracked) loginCompletionInFlight = null;
  });
  loginCompletionInFlight = tracked;
  return tracked;
}

async function performRefresh(epoch: number): Promise<UserSession | null> {
  if (logoutRequested()) return null;
  let response: Response;
  try {
    response = await sessionFetch("/api/session/refresh", {
      method: "POST",
      credentials: "same-origin",
    });
  } catch {
    throw new SessionRefreshError(
      "Le service de session est temporairement inaccessible.",
    );
  }
  if (response.status === 400 || response.status === 401) {
    if (epoch === authEpoch) invalidateLocalSession();
    return null;
  }
  if (!response.ok)
    throw new SessionRefreshError(
      response.status === 429
        ? "Le service de session reçoit trop de demandes. Réessaie dans quelques instants."
        : "Le service de session est temporairement indisponible.",
      response.status,
    );
  let tokens: TokenResponse;
  try {
    tokens = (await response.json()) as TokenResponse;
  } catch {
    throw new SessionRefreshError(
      "Réponse de session invalide.",
      response.status,
    );
  }
  // A logout or cross-tab invalidation that happened while the request was in
  // flight always wins over the late refresh response.
  return epoch === authEpoch && !logoutRequested()
    ? saveAccessSession(tokens)
    : null;
}

async function refreshSession(): Promise<UserSession | null> {
  if (refreshInFlight) return refreshInFlight;
  const epoch = authEpoch;
  const operation = performRefresh(epoch);
  refreshInFlight = operation;
  try {
    return await operation;
  } finally {
    if (refreshInFlight === operation) refreshInFlight = null;
  }
}

async function validSession(force = false) {
  if (logoutRequested()) return null;
  const session = readSession();
  if (session && !force && session.expiresAt > Date.now() + 15_000)
    return session;
  return refreshSession();
}

export async function realtimeWebSocketProtocols(
  forceRefresh = false,
): Promise<string[] | null> {
  const session = await validSession(forceRefresh);
  return session ? ["showdown-v1", `bearer.${session.accessToken}`] : null;
}

export async function authenticatedFetch(path: string, init: RequestInit = {}) {
  let session = await validSession();
  if (!session) throw new Error("Connexion requise.");
  const request = (token: string) => {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(apiPath(path), {
      ...init,
      headers,
    });
  };
  const tokenUsed = session.accessToken;
  let response = await request(tokenUsed);
  if (response.status === 401) {
    const current = readSession();
    session =
      current && current.accessToken !== tokenUsed
        ? current
        : await validSession(true);
    if (session) response = await request(session.accessToken);
  }
  if (response.status === 401 && session) void signOut();
  return response;
}

async function deleteServerSession() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 4_000);
  try {
    await fetch("/api/session/logout", {
      method: "POST",
      credentials: "same-origin",
      signal: controller.signal,
    });
  } catch {
    /* The logout tombstone keeps this browser signed out while offline. */
  } finally {
    window.clearTimeout(timeout);
  }
}

export function signOut() {
  if (signOutInFlight) return signOutInFlight;
  const pendingRefresh = refreshInFlight;
  invalidateLocalSession();
  const operation = (async () => {
    if (pendingRefresh) {
      await Promise.race([
        pendingRefresh.catch(() => null),
        new Promise<null>((resolve) =>
          window.setTimeout(() => resolve(null), 750),
        ),
      ]);
    }
    await deleteServerSession();
    if (pendingRefresh) {
      void pendingRefresh.then(deleteServerSession, deleteServerSession);
    }
  })();
  const tracked = operation.finally(() => {
    if (signOutInFlight === tracked) signOutInFlight = null;
  });
  signOutInFlight = tracked;
  return tracked;
}

export function subscribeToSessionInvalidation(callback: () => void) {
  const localListener = () => callback();
  const storageListener = (event: StorageEvent) => {
    if (event.key === LOGOUT_KEY && event.newValue)
      invalidateLocalSession(false);
  };
  window.addEventListener(SESSION_INVALIDATED_EVENT, localListener);
  window.addEventListener("storage", storageListener);
  return () => {
    window.removeEventListener(SESSION_INVALIDATED_EVENT, localListener);
    window.removeEventListener("storage", storageListener);
  };
}
