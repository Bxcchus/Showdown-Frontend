const HOP_BY_HOP = new Set(['connection', 'content-length', 'host', 'transfer-encoding']);

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const configuredOrigin = process.env.PINKWARD_BACKEND_ORIGIN;
  const origin = (configuredOrigin ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:8088' : '')).replace(/\/$/, '');
  if (!origin) return Response.json({ error: 'PINKWARD_BACKEND_ORIGIN is not configured' }, { status: 503 });
  const source = new URL(request.url);
  const target = `${origin}/${path.join('/')}${source.search}`;
  const headers = new Headers();
  request.headers.forEach((value, key) => { if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value); });
  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
    redirect: 'manual',
  });
  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => { if (!HOP_BY_HOP.has(key.toLowerCase())) responseHeaders.set(key, value); });
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const PATCH = proxy;
export const OPTIONS = proxy;
