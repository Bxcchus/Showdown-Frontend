import { assertSameOrigin, publicRequestOrigin } from "../session/_shared";
import { isLanguage, languageCookieHeader } from "../../lib/i18n-shared";

function safeReturnLocation(request: Request) {
  const fallback = "/";
  const referer = request.headers.get("referer");
  if (!referer) return fallback;
  try {
    const source = new URL(referer);
    if (source.origin !== publicRequestOrigin(request)) return fallback;
    return `${source.pathname}${source.search}${source.hash}` || fallback;
  } catch {
    return fallback;
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const form = await request.formData();
    const language = form.get("locale");
    if (!isLanguage(language)) {
      return Response.json(
        { error: "Langue non prise en charge." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const secure = new URL(request.url).protocol === "https:";
    const headers = {
      "Set-Cookie": languageCookieHeader(language, secure),
      "Cache-Control": "no-store",
      Vary: "Cookie, Accept-Language",
    };
    if (request.headers.get("accept")?.includes("application/json")) {
      return new Response(null, { status: 204, headers });
    }
    return new Response(null, {
      status: 303,
      headers: {
        ...headers,
        Location: safeReturnLocation(request),
      },
    });
  } catch (error) {
    if (error instanceof Response) {
      const headers = new Headers(error.headers);
      headers.set("Cache-Control", "no-store");
      return new Response(error.body, {
        status: error.status,
        statusText: error.statusText,
        headers,
      });
    }
    return Response.json(
      { error: "Impossible de changer la langue." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
