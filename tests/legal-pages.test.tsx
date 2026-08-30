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
    ["privacy", "POLITIQUE DE CONFIDENTIALITÉ"],
    ["terms", "CONDITIONS D’UTILISATION"],
  ] as const)("renders the unfinished French %s document", (document, title) => {
    renderDocument(document);
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByText(/À FINALISER/i)).toBeInTheDocument();
  });

  it("renders the completed French notice for a non-professional publisher", () => {
    renderDocument("legal");
    expect(
      screen.getByRole("heading", { name: "MENTIONS LÉGALES" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/À FINALISER/i)).not.toBeInTheDocument();
    expect(screen.getByText("ÉDITEUR NON PROFESSIONNEL")).toBeInTheDocument();
    expect(screen.getByText(/article 1-1, II/i)).toBeInTheDocument();
    expect(screen.getByText(/OVH SAS/i)).toBeInTheDocument();
    expect(screen.getByText(/2 rue Kellermann/i)).toBeInTheDocument();
  });

  it("renders the completed English legal notice", () => {
    renderDocument("legal", "en");
    expect(
      screen.getByRole("heading", { name: "LEGAL NOTICE" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/TO BE FINALISED/i)).not.toBeInTheDocument();
    expect(screen.getByText("NON-PROFESSIONAL PUBLISHER")).toBeInTheDocument();
    expect(screen.getByText(/OVH SAS/i)).toBeInTheDocument();
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
