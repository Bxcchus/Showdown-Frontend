const FORWARDED_REQUEST_HEADERS = new Set([
  "accept",
  "accept-language",
  "authorization",
  "content-type",
  "idempotency-key",
]);
const FORWARDED_RESPONSE_HEADERS = new Set([
  "content-language",
  "content-type",
  "etag",
  "last-modified",
  "retry-after",
  "www-authenticate",
  "x-correlation-id",
]);
const MAX_REQUEST_BODY_BYTES = 64 * 1024;
const MAX_QUERY_LENGTH = 8 * 1024;
const RESOURCE_ID = "[A-Za-z0-9_-]{1,128}";

type RouteRule = {
  methods: ReadonlySet<string>;
  path: RegExp;
};

const route = (methods: string[], path: RegExp): RouteRule => ({
  methods: new Set(methods),
  path,
});

// This BFF is a public browser boundary, not a generic tunnel to the gateway.
// Every method/path pair below is exercised by the GYMS.LOL frontend.
const PUBLIC_ROUTES: RouteRule[] = [
  route(["GET"], /^\/actuator\/health\/readiness$/),
  route(["GET"], /^\/api\/v2\/players\/directory$/),
  route(["GET", "PUT"], /^\/api\/v2\/players\/me$/),
  route(["POST", "DELETE"], /^\/api\/v2\/players\/me\/presence$/),
  route(["POST"], /^\/api\/v2\/players\/me\/riot-link-challenges$/),
  route(
    ["POST"],
    new RegExp(
      `^/api/v2/players/me/riot-link-challenges/${RESOURCE_ID}/complete$`,
    ),
  ),
  route(["GET", "POST", "DELETE"], /^\/api\/v2\/matchmaking\/queue$/),
  route(["GET"], /^\/api\/v2\/matches\/current$/),
  route(["GET"], /^\/api\/v2\/matches\/current-lobby$/),
  route(["GET"], /^\/api\/v2\/matches\/history$/),
  route(["GET"], new RegExp(`^/api/v2/matches/history/${RESOURCE_ID}$`)),
  route(["GET"], /^\/api\/v2\/matches\/statistics$/),
  route(["GET"], /^\/api\/v2\/matches\/duel\/statistics$/),
  route(["GET"], /^\/api\/v2\/matches\/leaderboard$/),
  route(["GET"], /^\/api\/v2\/matches\/duel\/leaderboard$/),
  route(["GET"], /^\/api\/v2\/matches\/seasons$/),
  route(["POST"], new RegExp(`^/api/v2/matches/${RESOURCE_ID}/ready$`)),
  route(
    ["POST"],
    new RegExp(`^/api/v2/matches/${RESOURCE_ID}/watcher-token$`),
  ),
  route(
    ["POST"],
    new RegExp(`^/api/v2/matches/duels/${RESOURCE_ID}/watcher-token$`),
  ),
  route(["POST"], /^\/api\/v2\/parties$/),
  route(["GET", "DELETE"], /^\/api\/v2\/parties\/current$/),
  route(["POST", "DELETE"], /^\/api\/v2\/parties\/current\/search$/),
  route(["PUT"], /^\/api\/v2\/parties\/current\/ready$/),
  route(["POST"], /^\/api\/v2\/parties\/current\/invitations$/),
  route(
    ["DELETE"],
    new RegExp(`^/api/v2/parties/current/members/${RESOURCE_ID}$`),
  ),
  route(["GET"], /^\/api\/v2\/parties\/invitations$/),
  route(
    ["POST"],
    new RegExp(
      `^/api/v2/parties/invitations/${RESOURCE_ID}/(?:accept|decline)$`,
    ),
  ),
];
const NULLABLE_GETS = new Set([
  "/api/v2/matchmaking/queue",
  "/api/v2/matches/current",
  "/api/v2/matches/current-lobby",
  "/api/v2/parties/current",
]);

function noStoreJson(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function canonicalTargetPath(path: string[]) {
  if (
    path.length === 0 ||
    path.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        segment.includes("/") ||
        segment.includes("\\") ||
        !/^[A-Za-z0-9._~-]+$/.test(segment),
    )
  )
    return null;
  return `/${path.join("/")}`;
}

function isPublicRoute(method: string, path: string) {
  return PUBLIC_ROUTES.some(
    (candidate) => candidate.methods.has(method) && candidate.path.test(path),
  );
}

async function requestBody(request: Request) {
  if (request.method === "GET" || request.method === "HEAD") return undefined;
  const declaredLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_REQUEST_BODY_BYTES
  )
    throw new Response("Payload trop volumineux.", { status: 413 });
  const body = await request.arrayBuffer();
  if (body.byteLength > MAX_REQUEST_BODY_BYTES)
    throw new Response("Payload trop volumineux.", { status: 413 });
  return body.byteLength ? body : undefined;
}

async function proxy(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const targetPath = canonicalTargetPath(path);
  if (!targetPath || !isPublicRoute(request.method, targetPath))
    return noStoreJson({ error: "Route publique inexistante." }, 404);
  const configuredOrigin = process.env.PINKWARD_BACKEND_ORIGIN;
  const origin = (
    configuredOrigin ??
    (process.env.NODE_ENV === "development" ? "http://localhost:8088" : "")
  ).replace(/\/$/, "");
  if (!origin) return noStoreJson({ error: "Backend non configuré." }, 503);
  const source = new URL(request.url);
  if (source.search.length > MAX_QUERY_LENGTH)
    return noStoreJson({ error: "Requête trop longue." }, 414);
  const target = `${origin}/${path.join("/")}${source.search}`;
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (FORWARDED_REQUEST_HEADERS.has(key.toLowerCase()))
      headers.set(key, value);
  });
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: await requestBody(request),
      redirect: "manual",
    });
  } catch (error) {
    if (error instanceof Response)
      return noStoreJson(
        {
          error:
            error.status === 413
              ? "Payload trop volumineux."
              : "Requête refusée.",
        },
        error.status,
      );
    return noStoreJson({ error: "Backend temporairement indisponible." }, 502);
  }
  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (FORWARDED_RESPONSE_HEADERS.has(key.toLowerCase()))
      responseHeaders.set(key, value);
  });
  responseHeaders.set("Cache-Control", "no-store");
  if (
    request.method === "GET" &&
    upstream.status === 404 &&
    NULLABLE_GETS.has(targetPath)
  ) {
    return Response.json(null, { status: 200, headers: responseHeaders });
  }
  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const PATCH = proxy;
export const OPTIONS = proxy;
