import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, Card, EmptyState, PageTitle } from "../app/components/ui";
import { LanguageProvider } from "../app/lib/i18n";

function renderLocalized(node: React.ReactNode) {
  return render(
    <LanguageProvider initialLanguage="fr">{node}</LanguageProvider>,
  );
}

describe("primitives accessibles", () => {
  it("conserve une hiérarchie de titres prévisible", () => {
    const { container } = renderLocalized(
      <>
        <PageTitle eyebrow="Contexte" title="Titre de page" text="Résumé" />
        <Card>
          <EmptyState title="Aucun résultat" text="Modifie tes filtres." />
        </Card>
      </>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveAttribute(
      "tabindex",
      "-1",
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Aucun résultat",
    );
    expect(container.querySelector(".page-title")?.tagName).toBe("HEADER");
    expect(container.querySelector(".card")?.tagName).toBe("DIV");
    expect(container.querySelector("section.card")).toBeNull();
  });

  it("garde les boutons non-submit par défaut", () => {
    renderLocalized(<Button>Continuer</Button>);
    expect(screen.getByRole("button", { name: "Continuer" })).toHaveAttribute(
      "type",
      "button",
    );
  });
});

describe("échelle typographique", () => {
  const styleFiles = [
    "globals.css",
    "design-system.css",
    "responsive.css",
    "feature-pages.css",
    "ergonomics.css",
  ];

  it("n’autorise plus de taille explicite inférieure à 13 px", () => {
    const violations = styleFiles.flatMap((file) => {
      const source = readFileSync(join(process.cwd(), "app", file), "utf8");
      return [...source.matchAll(/font-size:\s*([0-9.]+)px/g)]
        .filter((match) => Number(match[1]) < 13)
        .map((match) => `${file}: ${match[0]}`);
    });

    expect(violations).toEqual([]);
  });

  it("définit des tokens lisibles et des champs mobiles à 16 px", () => {
    const source = readFileSync(
      join(process.cwd(), "app", "ergonomics.css"),
      "utf8",
    );

    expect(source).toContain("--font-caption: 0.8125rem");
    expect(source).toContain("--font-meta: 0.875rem");
    expect(source).toContain("--font-body: 1rem");
    expect(source).toMatch(
      /:where\(input, select, textarea\)[\s\S]*?font-size: 1rem !important/,
    );
  });
});
