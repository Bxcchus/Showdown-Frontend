import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LegalPage, { type LegalDocument } from "../app/features/legal-pages";
import { LanguageProvider } from "../app/lib/i18n";
import { isKnownPath, pageFromPath } from "../app/lib/navigation";

function renderDocument(document: LegalDocument, language: "fr" | "en" = "fr") {
  return render(
    <LanguageProvider initialLanguage={language}>
      <LegalPage document={document} />
    </LanguageProvider>,
  );
}

describe("legal pages", () => {
  it.each([
    ["/legal", "legal"],
    ["/privacy", "privacy"],
    ["/terms", "terms"],
  ] as const)("recognises %s as the %s page", (path, page) => {
    expect(isKnownPath(path)).toBe(true);
    expect(pageFromPath(path)).toBe(page);
  });

  it.each([
    ["legal", "MENTIONS LÉGALES"],
    ["privacy", "POLITIQUE DE CONFIDENTIALITÉ"],
    ["terms", "CONDITIONS D’UTILISATION"],
  ] as const)("renders the French %s document", (document, title) => {
    renderDocument(document);
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByText(/À FINALISER/i)).toBeInTheDocument();
  });

  it("renders the complete English privacy document", () => {
    renderDocument("privacy", "en");
    expect(
      screen.getByRole("heading", { name: "PRIVACY POLICY" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/TO BE FINALISED/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Individual rights" }),
    ).toBeInTheDocument();
  });
});
