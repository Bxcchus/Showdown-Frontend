"use client";

import Link from "next/link";
import { Localized } from "./lib/i18n";

function NotFoundContent() {
  return (
    <Localized>
      <div className="not-found-shell">
        <header>
          <Link href="/" className="wordmark">
            GYMS.LOL
          </Link>
        </header>
        <main id="main-content" tabIndex={-1}>
          <span className="eyebrow">ERREUR 404</span>
          <h1 tabIndex={-1}>PAGE INTROUVABLE</h1>
          <p>
            Cette page n’existe pas ou a été déplacée. Reviens à l’accueil ou
            ouvre directement la file compétitive.
          </p>
          <div>
            <Link className="button button--primary" href="/">
              RETOUR À L’ACCUEIL
            </Link>
            <Link className="button button--outline" href="/play">
              JOUER
            </Link>
          </div>
        </main>
      </div>
    </Localized>
  );
}

export default function NotFound() {
  return <NotFoundContent />;
}
