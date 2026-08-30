import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../app/api/locale/route";
import { pageMetadata, siteMetadata } from "../app/lib/i18n-metadata";
import {
  LANGUAGE_COOKIE_MAX_AGE,
  languageCookieHeader,
  languageFromAcceptLanguage,
  resolveLanguage,
} from "../app/lib/i18n-shared";

function localeRequest(
  locale: string,
  {
    url = "http://localhost:3000/api/locale",
    origin = "http://localhost:3000",
    referer = "http://localhost:3000/leaderboard?region=EUW",
  }: { url?: string; origin?: string; referer?: string } = {},
) {
  const form = new FormData();
  form.set("locale", locale);
  return new Request(url, {
    method: "POST",
    headers: { Origin: origin, Referer: referer },
    body: form,
  });
}

describe("résolution serveur de la langue", () => {
  it("donne la priorité au cookie puis négocie Accept-Language", () => {
    expect(resolveLanguage("fr", "en-GB,en;q=0.9")).toBe("fr");
    expect(resolveLanguage("invalid", "en-GB,en;q=0.9")).toBe("en");
    expect(resolveLanguage(null, "fr-CA;q=0.8,en-GB;q=0.9")).toBe("en");
    expect(resolveLanguage(null, "en;q=0,fr;q=0.5")).toBe("fr");
    expect(resolveLanguage(null, "en;q=2,fr;q=0.4")).toBe("fr");
    expect(languageFromAcceptLanguage("de-DE,*;q=0.5")).toBe("fr");
  });

  it("produit un cookie de préférence protégé", () => {
    const local = languageCookieHeader("en", false);
    expect(local).toContain("pinkward.language=en");
    expect(local).toContain("Path=/");
    expect(local).toContain("HttpOnly");
    expect(local).toContain("SameSite=Lax");
    expect(local).toContain(`Max-Age=${LANGUAGE_COOKIE_MAX_AGE}`);
    expect(local).not.toContain("Secure");
    expect(languageCookieHeader("en", true)).toContain("Secure");
  });

  it("localise les métadonnées du site et des pages", () => {
    expect(siteMetadata("fr").title).toBe(
      "GYMS.LOL — Matchmaking communautaire",
    );
    expect(siteMetadata("en").title).toBe("GYMS.LOL — Community Matchmaking");
    expect(pageMetadata("fr", "leaderboard").title).toBe(
      "Classement · GYMS.LOL",
    );
    expect(pageMetadata("en", "leaderboard").title).toBe(
      "Leaderboard · GYMS.LOL",
    );
    expect(pageMetadata("en", "not-found").title).toBe(
      "Page not found · GYMS.LOL",
    );
  });
});

describe("route de changement de langue", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("pose le cookie et revient sur la route même origine", async () => {
    const response = await POST(localeRequest("en"));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/leaderboard?region=EUW");
    expect(response.headers.get("set-cookie")).toContain(
      "pinkward.language=en",
    );
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("vary")).toBe("Cookie, Accept-Language");
  });

  it("ajoute Secure en HTTPS", async () => {
    const response = await POST(
      localeRequest("fr", {
        url: "https://pinkward.test/api/locale",
        origin: "https://pinkward.test",
        referer: "https://pinkward.test/profile",
      }),
    );
    expect(response.headers.get("set-cookie")).toContain("Secure");
  });

  it("met à jour le cookie sans navigation pour le client interactif", async () => {
    const request = localeRequest("en");
    request.headers.set("Accept", "application/json");
    const response = await POST(request);
    expect(response.status).toBe(204);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("set-cookie")).toContain(
      "pinkward.language=en",
    );
  });

  it("fonctionne derrière le proxy avec l’origine publique configurée", async () => {
    vi.stubEnv("SHOWDOWN_WEB_ORIGIN", "https://gyms.lol");
    const response = await POST(
      localeRequest("en", {
        url: "http://web-app:3000/api/locale",
        origin: "https://gyms.lol",
        referer: "https://gyms.lol/play",
      }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/play");
    expect(response.headers.get("set-cookie")).toContain(
      "pinkward.language=en",
    );
    expect(response.headers.get("set-cookie")).toContain("Secure");
  });

  it("refuse une langue inconnue et une origine tierce", async () => {
    const invalid = await POST(localeRequest("de"));
    expect(invalid.status).toBe(400);
    expect(invalid.headers.get("set-cookie")).toBeNull();

    const crossOrigin = await POST(
      localeRequest("en", { origin: "https://attacker.example" }),
    );
    expect(crossOrigin.status).toBe(403);
    expect(crossOrigin.headers.get("set-cookie")).toBeNull();
  });

  it("neutralise un Referer externe", async () => {
    const response = await POST(
      localeRequest("en", { referer: "https://attacker.example/phishing" }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/");
  });
});
