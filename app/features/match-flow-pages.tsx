"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, PageTitle } from "../components/ui";
import { useBackend } from "../lib/backend";
import { Localized } from "../lib/i18n";
import type { Page } from "../lib/navigation";
import { watcherPresentation } from "../lib/presentation";

export function Searching({ go }: { go: (page: Page) => void }) {
  const backend = useBackend();
  const [seconds, setSeconds] = useState(() =>
    backend.queue
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(backend.queue.joinedAt).getTime()) / 1000,
          ),
        )
      : 0,
  );
  useEffect(() => {
    const tick = window.setInterval(() => setSeconds((v) => v + 1), 1000);
    return () => clearInterval(tick);
  }, []);
  useEffect(() => {
    if (backend.lobby) go("lobby");
    else if (backend.match?.status === "READY_CHECK") go("ready");
  }, [backend.lobby, backend.match, go]);
  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const queue = backend.queue;
  const mode = queue?.mode === "ONE_V_ONE" ? "1V1" : "5V5";
  const cancel = async () => {
    await backend.leaveQueue();
    go("play");
  };
  return (
    <Localized>
      <div className="page search-page">
        <PageTitle
          eyebrow="FILE ACTIVE"
          title="RECHERCHE D’UN MATCH"
          text="Reste sur GYMS.LOL pendant la recherche de joueurs."
        />
        <div className="search-grid">
          <Card className="search-card">
            <div className="search-stats">
              <span>
                <strong>{mode}</strong>
                <small>{queue?.region ?? "EUW"}</small>
              </span>
              <span>
                <b>
                  {queue?.primaryRole === "BOT"
                    ? "ADC"
                    : (queue?.primaryRole ?? "MID")}
                </b>
                <small>PRINCIPAL</small>
              </span>
              <span>
                <b>
                  {queue?.secondaryRole === "BOT"
                    ? "ADC"
                    : (queue?.secondaryRole ?? "JUNGLE")}
                </b>
                <small>SECONDAIRE</small>
              </span>
              <time
                className="timer"
                dateTime={`PT${seconds}S`}
                aria-label={`${seconds} secondes écoulées`}
              >
                <strong>{time}</strong>
                <small>écoulé</small>
              </time>
            </div>
            <div
              className="progress search-progress"
              role="progressbar"
              aria-label="Recherche d’un match en cours"
            >
              <i />
            </div>
            <p>
              {queue
                ? `Recherche autour de ${queue.mmr} MMR.`
                : "Synchronisation de la file…"}
            </p>
            <Button kind="danger" onClick={() => void cancel()}>
              ANNULER LA RECHERCHE
            </Button>
          </Card>
          <Card className="party-card searching-party">
            <h2>
              GROUPE {backend.party?.members.length ?? 1} /{" "}
              {backend.party?.capacity ?? 5}
            </h2>
            {backend.party ? (
              <div className="party-rows">
                {backend.party.members.map((member) => (
                  <div className="party-row" key={member.playerId}>
                    <strong>{member.displayName}</strong>
                    <span>{member.primaryRole}</span>
                    <b className={member.ready ? "positive" : ""}>
                      {member.ready ? "PRÊT" : "EN ATTENTE"}
                    </b>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-copy">Recherche en solo</p>
            )}
            <p>La recherche continue lorsque tu navigues sur le site.</p>
          </Card>
        </div>
        <Card className="queue-strip search-strip">
          <b>RECHERCHE</b>
          <strong>
            {mode} · {queue?.primaryRole ?? "MID"}/
            {queue?.secondaryRole ?? "JUNGLE"} · {queue?.region ?? "EUW"}
          </strong>
          <time>{time}</time>
          <button onClick={() => void cancel()}>ANNULER</button>
        </Card>
      </div>
    </Localized>
  );
}

export function Ready({ go }: { go: (page: Page) => void }) {
  const backend = useBackend();
  const refreshBackend = backend.refresh;
  const [responding, setResponding] = useState(false);
  const expiryRefresh = useRef(false);
  const [seconds, setSeconds] = useState(() =>
    backend.match
      ? Math.max(
          0,
          Math.ceil(
            (new Date(backend.match.readyDeadline).getTime() - Date.now()) /
              1000,
          ),
        )
      : 0,
  );
  useEffect(() => {
    const timer = window.setInterval(
      () => setSeconds((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (backend.lobby) go("lobby");
  }, [backend.lobby, go]);
  useEffect(() => {
    if (seconds !== 0 || expiryRefresh.current) return;
    expiryRefresh.current = true;
    void refreshBackend();
  }, [refreshBackend, seconds]);
  const current = backend.match?.players.find(
    (player) => player.playerId === backend.session?.playerId,
  );
  const accept = async () => {
    setResponding(true);
    try {
      await backend.answerReady(true);
    } finally {
      setResponding(false);
    }
  };
  const decline = async () => {
    setResponding(true);
    try {
      if (await backend.answerReady(false)) go("play");
    } finally {
      setResponding(false);
    }
  };
  const accepted =
    backend.match?.players.filter((player) => player.readyState === "ACCEPTED")
      .length ?? 0;
  const expired = seconds <= 0;
  const pending = current?.readyState === "PENDING";
  const totalSeconds = backend.match
    ? Math.max(
        1,
        Math.ceil(
          (new Date(backend.match.readyDeadline).getTime() -
            new Date(backend.match.createdAt).getTime()) /
            1000,
        ),
      )
    : 1;
  const remainingProgress = Math.max(
    0,
    Math.min(100, (seconds / totalSeconds) * 100),
  );
  return (
    <Localized>
      <div className="page ready-page">
        <PageTitle
          eyebrow="MATCH TROUVÉ"
          title="CONFIRMATION"
          text="Ton match est prêt. Confirme avant la fin du compte à rebours."
        />
        <Card className="ready-card">
          <h2>{backend.match?.mode === "ONE_V_ONE" ? "1V1" : "5V5"}</h2>
          <b>
            {current?.assignedRole === "BOT"
              ? "ADC"
              : (current?.assignedRole ?? "MID")}{" "}
            · {backend.match?.region ?? "EUW"}
          </b>
          <time
            className="ready-timer"
            role="timer"
            dateTime={`PT${seconds}S`}
            aria-label={`${seconds} secondes restantes`}
          >
            {String(Math.floor(seconds / 60)).padStart(2, "0")}:
            {String(seconds % 60).padStart(2, "0")}
          </time>
          <small>
            {accepted} / {backend.match?.players.length ?? 5} JOUEURS PRÊTS
          </small>
          <div className="progress ready-progress" aria-hidden="true">
            <i style={{ width: `${remainingProgress}%` }} />
          </div>
          {pending && !expired ? (
            <div>
              <Button
                kind="success"
                disabled={responding}
                onClick={() => void accept()}
              >
                {responding ? "ENVOI…" : "ACCEPTER"}
              </Button>
              <Button
                kind="danger"
                disabled={responding}
                onClick={() => void decline()}
              >
                REFUSER
              </Button>
            </div>
          ) : (
            <div className="ready-response" role="status" aria-live="polite">
              <strong>
                {expired
                  ? "DÉLAI EXPIRÉ"
                  : current?.readyState === "ACCEPTED"
                    ? "TU AS ACCEPTÉ"
                    : "MATCH REFUSÉ"}
              </strong>
              <span>
                {expired
                  ? "Synchronisation avec le serveur…"
                  : current?.readyState === "ACCEPTED"
                    ? "En attente des autres joueurs."
                    : "Retourne à la sélection du mode."}
              </span>
              {(expired || current?.readyState === "DECLINED") && (
                <Button kind="outline" onClick={() => go("play")}>
                  RETOUR À JOUER
                </Button>
              )}
            </div>
          )}
        </Card>
        <Card className="ready-players">
          {(backend.match?.players ?? []).map((player) => (
            <span
              className={player.readyState === "ACCEPTED" ? "positive" : ""}
              key={player.playerId}
            >
              {player.bot ? "BOT" : player.playerId.slice(0, 8)}{" "}
              {player.readyState === "ACCEPTED"
                ? "PRÊT"
                : player.readyState === "DECLINED"
                  ? "REFUSÉ"
                  : "EN ATTENTE"}
            </span>
          ))}
        </Card>
      </div>
    </Localized>
  );
}

function Team({ title, players }: { title: string; players: string[][] }) {
  return (
    <Card className="team-card">
      <h2>{title}</h2>
      <ul className="team-list">
        {players.map(([role, name, status]) => (
          <li className="team-row" key={name}>
            <b>{role}</b>
            <strong>{name}</strong>
            <span className={status === "PRÊT" ? "positive" : ""}>
              {status}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
export function Lobby() {
  const backend = useBackend();
  const lobby = backend.lobby;
  const toRows = (team: "BLUE" | "RED") =>
    lobby?.players
      .filter((player) => player.team === team)
      .map((player, index) => [
        player.assignedRole === "BOT" ? "ADC" : player.assignedRole,
        player.bot
          ? `GYMS.LOL BOT ${index + 1}`
          : (backend.playerNames[player.playerId] ??
            player.playerId.slice(0, 8)),
        player.readyState === "ACCEPTED"
          ? "PRÊT"
          : player.readyState === "DECLINED"
            ? "REFUSÉ"
            : "EN ATTENTE",
      ]) ?? [];
  const ready =
    lobby?.players.filter((player) => player.readyState === "ACCEPTED")
      .length ?? 0;
  const total = lobby?.players.length ?? 0;
  return (
    <Localized>
      <div className="page lobby-page">
        <PageTitle
          eyebrow="MATCH CONFIRMÉ"
          title="LOBBY DU MATCH"
          text={`${lobby?.mode === "ONE_V_ONE" ? "Partie personnalisée 1v1" : "Partie personnalisée 5v5"} · ${lobby?.region ?? "EUW"} · Équipes et rôles attribués`}
        />
        <div className="lobby-grid">
          <Team title="ÉQUIPE BLEUE" players={toRows("BLUE")} />
          <Team title="ÉQUIPE ROUGE" players={toRows("RED")} />
          <aside className="lobby-status">
            <Card className="lobby-control">
              <header>
                <span>
                  <small>JOUEURS PRÊTS</small>
                  <strong>
                    {ready}/{total}
                  </strong>
                </span>
                <b className={total > 0 && ready === total ? "positive" : ""}>
                  {total > 0 && ready === total ? "CONFIRMÉ" : "EN ATTENTE"}
                </b>
              </header>
              <div className="lobby-credential">
                <small>NOM DU LOBBY</small>
                <strong>{lobby?.lobbyName ?? "EN ATTENTE"}</strong>
              </div>
              <div className="lobby-credential">
                <small>MOT DE PASSE</small>
                <strong>{lobby?.lobbyPassword ?? "EN ATTENTE"}</strong>
              </div>
              <div className="lobby-watcher" role="status" aria-live="polite">
                <span
                  className={backend.watcherOnline ? "online-dot" : ""}
                  aria-hidden="true"
                />
                <div>
                  <small>WATCHER LOCAL</small>
                  <strong
                    className={backend.watcherOnline ? "positive" : "negative"}
                  >
                    {
                      watcherPresentation(
                        backend.watcherOnline,
                        backend.watcherJob,
                      ).label
                    }
                  </strong>
                </div>
              </div>
              {backend.watcherJob?.detail && (
                <p>{backend.watcherJob.detail.replaceAll("_", " ")}</p>
              )}
            </Card>
            <Button
              kind="outline"
              onClick={() => void backend.refreshWatcher()}
            >
              ACTUALISER LE WATCHER
            </Button>
            <p className="verified-result-note">
              {lobby?.mode === "ONE_V_ONE"
                ? "Le résultat est envoyé automatiquement par le Watcher après le premier sang, 100 CS ou la première tourelle."
                : "Le Watcher vérifie les joueurs, suit le lancement et transmet le résultat final du match 5v5."}
            </p>
          </aside>
        </div>
      </div>
    </Localized>
  );
}
