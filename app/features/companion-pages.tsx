"use client";

import { Card, PageTitle } from "../components/ui";
import { Localized } from "../lib/i18n";

export function Download() {
  return (
    <Localized>
      <div className="page download-page">
        <PageTitle
          eyebrow="APPLICATION WINDOWS"
          title="SHOWDOWN WATCHER"
          text="Connecte GYMS.LOL à League et valide automatiquement chaque duel."
        />
        <Card className="download-hero">
          <div className="download-copy">
            <span className="release-label">
              <i />
              DISTRIBUTION EN PRÉPARATION • SIGNATURE WINDOWS REQUISE
            </span>
            <h2>
              TES DUELS.
              <br />
              VÉRIFIÉS LOCALEMENT.
            </h2>
            <p>
              Showdown Watcher accompagne le client League, prépare le lobby du
              duel et transmet les objectifs à GYMS.LOL en temps réel.
            </p>
            <div className="download-actions">
              <span className="button download-cta" aria-disabled="true">
                BIENTÔT DISPONIBLE
              </span>
              <span>
                <strong>WINDOWS 10 / 11 · X64</strong>
                <small>
                  L’exécutable public sera signé et publié avec son empreinte
                </small>
              </span>
            </div>
          </div>
          <div
            className="watcher-console"
            role="img"
            aria-label="Aperçu de la connexion du Watcher"
          >
            <div className="console-bar">
              <span>GYMS.LOL / WATCHER</span>
              <b>−</b>
              <b>□</b>
              <b>×</b>
            </div>
            <div className="console-body">
              <small>ÉTAT</small>
              <strong>
                <i /> WATCHER EN LIGNE
              </strong>
              <span>
                <b>ADRESSE LOCALE</b>127.0.0.1:43991
              </span>
              <span>
                <b>CLIENT LEAGUE</b>CONNECTÉ
              </span>
              <span>
                <b>DUEL ACTIF</b>EN ATTENTE
              </span>
              <p>&gt; Prêt à recevoir un duel GYMS.LOL.</p>
            </div>
          </div>
        </Card>
        <section className="watcher-features">
          <Card>
            <b>01</b>
            <h2>LOCAL PAR CONCEPTION</h2>
            <p>
              L’application écoute uniquement sur ton ordinateur. Aucun port
              public et aucun accès permanent au compte.
            </p>
          </Card>
          <Card>
            <b>02</b>
            <h2>CONNECTÉ À LEAGUE</h2>
            <p>
              Utilise les API locales du client League et de Live Client Data
              pour suivre le lobby et la partie.
            </p>
          </Card>
          <Card>
            <b>03</b>
            <h2>FAIR-PLAY AVANT TOUT</h2>
            <p>
              Aucune lecture mémoire et aucune injection de code. Seules les
              interfaces locales officielles du jeu sont observées.
            </p>
          </Card>
        </section>
        <Card className="install-card">
          <div>
            <span className="eyebrow">INSTALLATION RAPIDE</span>
            <h2>PRÊT EN TROIS ÉTAPES</h2>
          </div>
          <ol>
            <li>
              <b>01</b>
              <span>
                <strong>TÉLÉCHARGER</strong>
                <small>Enregistre l’exécutable Windows.</small>
              </span>
            </li>
            <li>
              <b>02</b>
              <span>
                <strong>OUVRIR LEAGUE</strong>
                <small>Connecte-toi au client League.</small>
              </span>
            </li>
            <li>
              <b>03</b>
              <span>
                <strong>LANCER LE WATCHER</strong>
                <small>Garde-le ouvert pendant tes matchs GYMS.LOL.</small>
              </span>
            </li>
          </ol>
          <p>Aucun exécutable non signé n’est distribué depuis le site.</p>
        </Card>
      </div>
    </Localized>
  );
}
