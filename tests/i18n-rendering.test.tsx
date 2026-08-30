import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageProvider, Localized, useLanguage } from "../app/lib/i18n";

function LocaleProbe() {
  const { formatDate, language } = useLanguage();
  return (
    <Localized>
      <main data-language={language}>
        <h1>CLASSEMENT</h1>
        <p>{formatDate("2026-08-28T12:00:00Z")}</p>
      </main>
    </Localized>
  );
}

describe("rendu initial localisé", () => {
  it("rend l’anglais de manière synchrone sans dépendre du navigateur", () => {
    window.localStorage.setItem("pinkward.language", "fr");
    const html = renderToStaticMarkup(
      <LanguageProvider initialLanguage="en">
        <LocaleProbe />
      </LanguageProvider>,
    );
    expect(html).toContain('data-language="en"');
    expect(html).toContain("<h1>LEADERBOARD</h1>");
    expect(html).not.toContain("CLASSEMENT");
    expect(html).toContain("28/08/2026");
  });

  it("conserve le français quand le serveur choisit fr", () => {
    const html = renderToStaticMarkup(
      <LanguageProvider initialLanguage="fr">
        <LocaleProbe />
      </LanguageProvider>,
    );
    expect(html).toContain('data-language="fr"');
    expect(html).toContain("<h1>CLASSEMENT</h1>");
  });
});
