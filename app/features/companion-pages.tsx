"use client";

import { Button, Card, PageTitle } from "../components/ui";
import { useBackend } from "../lib/backend";
import { Localized } from "../lib/i18n";
import type { Page } from "../lib/navigation";
import { watcherPresentation } from "../lib/presentation";

export function Download() {
  return (
    <Localized>
      <div className="page download-page">
        <PageTitle
          eyebrow="APPLICATION WINDOWS"
          title="SHOWDOWN WATCHER"
          text="Connecte Pinkward à League et valide automatiquement chaque duel."
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
              duel et transmet les objectifs à Pinkward en temps réel.
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
              <span>PINKWARD / WATCHER</span>
              <b>_</b>
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
              <p>&gt; Prêt à recevoir un duel Pinkward.</p>
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
                <small>Garde-le ouvert pendant tes matchs Pinkward.</small>
              </span>
            </li>
          </ol>
          <p>Aucun exécutable non signé n’est distribué depuis le site.</p>
        </Card>
      </div>
    </Localized>
  );
}

export function Settings({ go }: { go: (page: Page) => void }) {
  const backend = useBackend();
  const watcher = watcherPresentation(
    backend.watcherOnline,
    backend.watcherJob,
  );
  return (
    <Localized>
      <div className="page settings-page">
        <PageTitle
          eyebrow="APPLICATION LOCALE"
          title="PARAMÈTRES DU WATCHER"
          text="Connexion locale, identité Riot et sécurité du compagnon Windows."
        />
        <div className="settings-grid settings-grid--single">
          <Card className="settings-card">
            <h2>SHOWDOWN WATCHER</h2>
            <p>
              Passerelle locale entre Pinkward Web et le client League pour
              vérifier les duels 1v1.
            </p>
            <div className="companion-status">
              <span>
                <small>PROCESSUS WATCHER</small>
                <strong
                  className={backend.watcherOnline ? "positive" : "negative"}
                >
                  {backend.watcherOnline ? "CONNECTÉ" : "HORS LIGNE"}
                </strong>
              </span>
              <b>127.0.0.1:43991 · v0.1.0</b>
            </div>
            <div className="setting-row">
              <span>État du duel League</span>
              <i className={`status-pill status-${watcher.tone}`}>
                {watcher.label}
              </i>
            </div>
            <div className="setting-row">
              <span>Riot ID</span>
              <i>{backend.profile?.riotId ?? "NON LIÉ"}</i>
            </div>
            <p className={`watcher-detail status-panel status-${watcher.tone}`}>
              {watcher.description}
            </p>
            <div className="settings-actions">
              <Button
                kind="outline"
                onClick={() => void backend.refreshWatcher()}
              >
                ACTUALISER
              </Button>
              <Button
                kind="outline"
                onClick={() => void backend.linkRiotId()}
                disabled={!backend.session}
              >
                LIER LE RIOT ID
              </Button>
              <Button onClick={() => go("download")}>
                TÉLÉCHARGER POUR WINDOWS
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Localized>
  );
}
