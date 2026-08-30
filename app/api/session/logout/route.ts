import {
  assertSameOrigin,
  cookieHeader,
  refreshCookie,
  revokeRefreshToken,
} from "../_shared";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const token = refreshCookie(request);
    if (token) await revokeRefreshToken(token);
    return new Response(null, {
      status: 204,
      headers: {
        "Set-Cookie": cookieHeader("", 0),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const status = error instanceof Response ? error.status : 500;
    return Response.json(
      {
        error:
          "La session locale a été supprimée, mais sa révocation distante a échoué.",
      },
      {
        status,
        headers: {
          "Set-Cookie": cookieHeader("", 0),
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
