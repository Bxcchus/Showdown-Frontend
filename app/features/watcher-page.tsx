"use client";

import { Button, Card, PageTitle } from "../components/ui";
import { useBackend } from "../lib/backend";
import type { Page } from "../lib/navigation";
import { watcherPresentation } from "../lib/presentation";

export default function WatcherPage({ go }: { go: (page: Page) => void }) {
  const backend = useBackend();
  const riotLinked = Boolean(backend.profile?.riotId);
  const watcher = watcherPresentation(
    backend.watcherOnline,
    backend.watcherJob,
  );

  return (
    <div className="page duels-page watcher-page">
      <PageTitle
        eyebrow="PASSERELLE LEAGUE LOCALE"
        title="CENTRE DE CONTRÔLE DU WATCHER"
        text="Connecte le client League et vérifie automatiquement les objectifs des duels 1v1."
        action={
          !backend.session ? (
            <Button onClick={() => void backend.login()}>SE CONNECTER</Button>
          ) : (
            <Button
              kind="outline"
              onClick={() =>
                void Promise.all([backend.refreshWatcher(), backend.refresh()])
              }
            >
              ACTUALISER L’ÉTAT
            </Button>
          )
        }
      />

      <Card className="watcher-overview-card">
        <div
          className="watcher-overview-status"
          role="status"
          aria-live="polite"
        >
          <i
            className={backend.watcherOnline ? "online-dot" : ""}
            aria-hidden="true"
          />
          <span>
            <small>PROCESSUS WATCHER</small>
            <strong>{backend.watcherOnline ? "CONNECTÉ" : "HORS LIGNE"}</strong>
          </span>
        </div>
        <dl className="watcher-overview-metrics">
          <div>
            <dt>ADRESSE LOCALE</dt>
            <dd>127.0.0.1:43991</dd>
          </div>
          <div>
            <dt>COMPTE SHOWDOWN</dt>
            <dd>{backend.profile?.displayName ?? "NON CONNECTÉ"}</dd>
          </div>
          <div>
            <dt>RIOT ID</dt>
            <dd>{backend.profile?.riotId ?? "NON LIÉ"}</dd>
          </div>
          <div>
            <dt>MODE DU WATCHER</dt>
            <dd>LOCAL UNIQUEMENT</dd>
          </div>
        </dl>
        <b
          className={`status-text status-${watcher.tone}`}
          role="status"
          aria-live="polite"
        >
          {watcher.label}
        </b>
      </Card>

      <div className="watcher-control-grid">
        <Card className="watcher-setup-card">
          <header>
            <div>
              <span className="eyebrow">VÉRIFICATION DE LA CONNEXION</span>
              <h2>PRÊT À SURVEILLER ?</h2>
            </div>
            <b>
              {backend.session && backend.watcherOnline && riotLinked
                ? "3/3"
                : `${Number(Boolean(backend.session)) + Number(backend.watcherOnline) + Number(riotLinked)}/3`}
            </b>
          </header>
          <ol className="watcher-checklist">
            <li className={backend.session ? "complete" : ""}>
              <i aria-hidden="true">{backend.session ? "✓" : "1"}</i>
              <span>
                <strong>SESSION SHOWDOWN</strong>
                <small>
                  {backend.session
                    ? "Compte authentifié et prêt."
                    : "Connecte-toi à ton compte web."}
                </small>
              </span>
            </li>
            <li className={backend.watcherOnline ? "complete" : ""}>
              <i aria-hidden="true">{backend.watcherOnline ? "✓" : "2"}</i>
              <span>
                <strong>WATCHER LOCAL</strong>
                <small>
                  {backend.watcherOnline
                    ? "Détecté sur cet ordinateur."
                    : "Télécharge puis lance le Watcher Windows."}
                </small>
              </span>
            </li>
            <li className={riotLinked ? "complete" : ""}>
              <i aria-hidden="true">{riotLinked ? "✓" : "3"}</i>
              <span>
                <strong>RIOT ID</strong>
                <small>
                  {riotLinked
                    ? backend.profile?.riotId
                    : "Ouvre League puis lie ton identité."}
                </small>
              </span>
            </li>
          </ol>
          <div className="watcher-setup-actions">
            {!backend.watcherOnline && (
              <Button onClick={() => go("download")}>
                TÉLÉCHARGER LE WATCHER
              </Button>
            )}
            {backend.watcherOnline && !riotLinked && (
              <Button
                disabled={!backend.session || backend.busy}
                onClick={() => void backend.linkRiotId()}
              >
                LIER LE RIOT ID
              </Button>
            )}
            {backend.watcherOnline && riotLinked && (
              <Button
                kind="outline"
                disabled={backend.busy}
                onClick={() => void backend.linkRiotId()}
              >
                ACTUALISER LE RIOT ID
              </Button>
            )}
            <Button
              kind="outline"
              onClick={() => void backend.refreshWatcher()}
            >
              VÉRIFIER À NOUVEAU
            </Button>
          </div>
        </Card>

        <Card className="watcher-activity-card">
          <span className="eyebrow">SUIVI EN DIRECT</span>
          <h2>ACTIVITÉ DU WATCHER</h2>
          <p>
            Le Watcher consulte uniquement les interfaces locales officielles du
            client League et de Live Client Data. Il ne lit pas la mémoire du
            jeu et n’injecte aucun code.
          </p>
          <dl className="watcher-activity-console">
            <div>
              <dt>PROCESSUS</dt>
              <dd className={backend.watcherOnline ? "positive" : "negative"}>
                {backend.watcherOnline ? "CONNECTÉ" : "HORS LIGNE"}
              </dd>
            </div>
            <div>
              <dt>ÉTAT DU DUEL</dt>
              <dd className={`status-text status-${watcher.tone}`}>
                {watcher.label}
              </dd>
            </div>
            <div>
              <dt>DÉTAIL</dt>
              <dd>{watcher.description}</dd>
            </div>
            <div>
              <dt>DERNIER OBJECTIF</dt>
              <dd>
                {backend.watcherJob?.objective?.replaceAll("_", " ") ?? "AUCUN"}
              </dd>
            </div>
            <div>
              <dt>DERNIER RÉSULTAT</dt>
              <dd>
                {backend.watcherJob?.outcome === "VICTORY"
                  ? "VICTOIRE"
                  : backend.watcherJob?.outcome === "DEFEAT"
                    ? "DÉFAITE"
                    : "EN ATTENTE"}
              </dd>
            </div>
          </dl>
          <div className="watcher-objectives">
            <small>OBJECTIFS 1V1 SURVEILLÉS</small>
            <div>
              <span>PREMIER SANG</span>
              <span>100 CS EN PREMIER</span>
              <span>PREMIÈRE TOURELLE</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
