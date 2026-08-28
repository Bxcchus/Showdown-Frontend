'use client';

const CLIENT_ID = 'pinkward-web';
const SCOPES = 'openid profile:read profile:write party:manage queue:write match:read match:ready match:result';
const SESSION_KEY = 'pinkward.oauth.session';
const FLOW_KEY = 'pinkward.oauth.flow';

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

type TokenClaims = { sub: string; preferred_username?: string };
type AuthorizationFlow = { state: string; verifier: string; redirectUri: string };

export type UserSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  playerId: string;
  username: string;
};

export const apiPath = (path: string) => `/backend${path}`;

function identityOrigin() {
  const configured = process.env.NEXT_PUBLIC_PINKWARD_IDENTITY_ORIGIN;
  if (configured) return configured.replace(/\/$/, '');
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8088';
  }
  throw new Error('Le domaine HTTPS de l’API Pinkward doit être configuré avant la connexion publique.');
}

function randomUrlSafe(bytes: number) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return base64Url(value);
}

function base64Url(value: Uint8Array) {
  let binary = '';
  value.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

async function codeChallenge(verifier: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

function decodeClaims(token: string): TokenClaims {
  const payload = token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
  const padding = '='.repeat((4 - payload.length % 4) % 4);
  return JSON.parse(atob(payload + padding)) as TokenClaims;
}

function saveSession(tokens: TokenResponse) {
  const claims = decodeClaims(tokens.access_token);
  const session: UserSession = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    playerId: claims.sub,
    username: claims.preferred_username ?? 'Pinkward player',
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function readSession(): UserSession | null {
  const serialized = sessionStorage.getItem(SESSION_KEY);
  if (!serialized) return null;
  try { return JSON.parse(serialized) as UserSession; }
  catch { sessionStorage.removeItem(SESSION_KEY); return null; }
}

export async function beginLogin() {
  const verifier = randomUrlSafe(64);
  const flow: AuthorizationFlow = {
    state: randomUrlSafe(32),
    verifier,
    redirectUri: `${window.location.origin}/oauth/callback`,
  };
  sessionStorage.setItem(FLOW_KEY, JSON.stringify(flow));
  const parameters = new URLSearchParams({
    response_type: 'code', client_id: CLIENT_ID, scope: SCOPES,
    redirect_uri: flow.redirectUri, state: flow.state,
    code_challenge: await codeChallenge(verifier), code_challenge_method: 'S256',
  });
  window.location.assign(`${identityOrigin()}/oauth2/authorize?${parameters}`);
}

export async function completeLogin(): Promise<UserSession | null> {
  if (window.location.pathname !== '/oauth/callback') return readSession();
  const query = new URLSearchParams(window.location.search);
  if (query.get('error')) throw new Error(query.get('error_description') ?? query.get('error') ?? 'Connexion refusée');
  const serialized = sessionStorage.getItem(FLOW_KEY);
  const code = query.get('code');
  const state = query.get('state');
  if (!serialized || !code || !state) throw new Error('Réponse OAuth2 incomplète.');
  const flow = JSON.parse(serialized) as AuthorizationFlow;
  if (state !== flow.state) throw new Error('État OAuth2 invalide.');
  const response = await fetch(apiPath('/oauth2/token'), {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', client_id: CLIENT_ID,
      redirect_uri: flow.redirectUri, code, code_verifier: flow.verifier }),
  });
  if (!response.ok) throw new Error('Échange du code OAuth2 refusé.');
  sessionStorage.removeItem(FLOW_KEY);
  const session = saveSession(await response.json() as TokenResponse);
  window.history.replaceState({}, '', '/');
  return session;
}

async function refreshSession(session: UserSession): Promise<UserSession | null> {
  if (!session.refreshToken) return null;
  const response = await fetch(apiPath('/oauth2/token'), {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', client_id: CLIENT_ID, refresh_token: session.refreshToken }),
  });
  if (!response.ok) return null;
  const refreshed = saveSession(await response.json() as TokenResponse);
  if (!refreshed.refreshToken) refreshed.refreshToken = session.refreshToken;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(refreshed));
  return refreshed;
}

async function validSession(force = false) {
  const session = readSession();
  if (!session) return null;
  if (!force && session.expiresAt > Date.now() + 15_000) return session;
  const refreshed = await refreshSession(session);
  if (!refreshed) signOut();
  return refreshed;
}

export async function authenticatedFetch(path: string, init: RequestInit = {}) {
  let session = await validSession();
  if (!session) throw new Error('Connexion requise.');
  const request = (token: string) => fetch(apiPath(path), {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  });
  let response = await request(session.accessToken);
  if (response.status === 401) {
    session = await validSession(true);
    if (session) response = await request(session.accessToken);
  }
  return response;
}

export function signOut() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(FLOW_KEY);
}
