"use client";

import { useState } from "react";
import Image from "next/image";
import { Button, Card, EmptyState } from "../components/ui";
import { useBackend } from "../lib/backend";
import { Localized, useLanguage } from "../lib/i18n";
import type { Page } from "../lib/navigation";
import { fiveRankPresentation, rankIcon } from "../lib/presentation";

export function Home({ go }: { go: (page: Page) => void }) {
  const backend = useBackend();
  const { formatDate } = useLanguage();
  const [quickMode, setQuickMode] = useState<"1V1" | "5V5">(() => {
    if (typeof window === "undefined") return "5V5";
    try {
      return window.localStorage.getItem("pinkward.quick-mode") === "1V1"
        ? "1V1"
        : "5V5";
    } catch {
      return "5V5";
    }
  });
  const partyPortraits = [
    "akali",
    "leblanc",
    "zed",
    "sylas",
    "orianna",
  ] as const;
  const recentPortraits = ["sylas", "zed", "akali", "orianna"] as const;
  const liveMatches = backend.recentHistory.slice(0, 4);
  const members = backend.party?.members ?? [];
  const selectQuickMode = (value: "1V1" | "5V5") => {
    setQuickMode(value);
    try {
      window.localStorage.setItem("pinkward.quick-mode", value);
    } catch {
      /* The selection still works when storage is unavailable. */
    }
  };
  const startQuickPlay = async () => {
    if (!backend.session) {
      await backend.login();
      return;
    }
    if (backend.lobby) return go("lobby");
    if (backend.match) return go("ready");
    if (backend.queue) return go("searching");
    if (
      quickMode === "1V1" &&
      (!backend.watcherOnline || !backend.profile?.riotId)
    ) {
      go(backend.watcherOnline ? "duels" : "download");
      return;
    }
    if (
      quickMode === "5V5" &&
      backend.party &&
      (!backend.party.viewerIsLeader || !backend.party.allReady)
    ) {
      go("play");
      return;
    }
    const primary = backend.profile?.primaryRole ?? "MID";
    const secondary = backend.profile?.secondaryRole ?? "JUNGLE";
    const joined = await backend.joinQueue(
      quickMode === "1V1" ? "ONE_V_ONE" : "FIVE_V_FIVE",
      quickMode === "1V1" ? "MID" : primary,
      quickMode === "1V1" ? "JUNGLE" : secondary,
    );
    if (joined) go("searching");
  };
  return (
    <Localized>
      <div className="page home-page home-dashboard">
        <h1 className="sr-only" tabIndex={-1}>
          PINKWARD SHOWDOWN
        </h1>
        <aside className="home-rail" aria-label="Raccourcis de jeu">
          <Card className="quick-play-card">
            <h2>PARTIE RAPIDE</h2>
            <div className="queue-preset quick-play-preset">
              <Image
                src={
                  quickMode === "5V5"
                    ? "/mode-icons/summoners-rift-active.png"
                    : "/mode-icons/aram-active.png"
                }
                alt=""
                aria-hidden="true"
                width={38}
                height={38}
              />
              <span>
                <strong>
                  {quickMode === "5V5"
                    ? "FAILLE DE L'INVOCATEUR"
                    : "ABÎME HURLANT"}
                </strong>
                <small>
                  {quickMode === "5V5" ? "5V5 · TrueSkill" : "1V1 · Glicko-2"}
                </small>
              </span>
              <select
                aria-label="Mode de partie rapide"
                value={quickMode}
                onChange={(event) =>
                  selectQuickMode(event.target.value as "1V1" | "5V5")
                }
              >
                <option value="5V5">5V5</option>
                <option value="1V1">1V1</option>
              </select>
            </div>
            <Button
              disabled={backend.busy}
              onClick={() => void startQuickPlay()}
            >
              {backend.busy
                ? "RECHERCHE…"
                : backend.session
                  ? "JOUER MAINTENANT"
                  : "SE CONNECTER"}
            </Button>
          </Card>
          <Card className="home-party-card">
            <h2>TON GROUPE</h2>
            <div>
              {members.length ? (
                members.map((member, index) => (
                  <button
                    type="button"
                    className="home-party-member"
                    key={member.playerId}
                    onClick={() => go("play")}
                  >
                    <Image
                      src={`/champion-icons/${partyPortraits[index % partyPortraits.length]}.png`}
                      alt=""
                      aria-hidden="true"
                      width={42}
                      height={42}
                    />
                    <span>
                      <strong>{member.displayName}</strong>
                      <small>
                        {member.primaryRole === "BOT"
                          ? "ADC"
                          : member.primaryRole}{" "}
                        ·{" "}
                        {member.ready
                          ? "PRÊT"
                          : member.online
                            ? "EN LIGNE"
                            : "HORS LIGNE"}
                      </small>
                    </span>
                  </button>
                ))
              ) : (
                <p className="empty-copy">
                  {backend.session
                    ? "Crée un groupe pour inviter des coéquipiers."
                    : "Connecte-toi pour afficher ton groupe."}
                </p>
              )}
            </div>
            <button
              className="home-invite"
              type="button"
              onClick={() =>
                backend.session ? go("play") : void backend.login()
              }
            >
              +&nbsp;&nbsp;{" "}
              {backend.party ? "GÉRER LE GROUPE" : "CRÉER UN GROUPE"}
            </button>
          </Card>
        </aside>
        <section className="home-stage">
          <div className="home-hero-row">
            <Card className="season-card">
              <div className="season-copy">
                <span className="eyebrow">
                  {backend.statistics?.season ?? "SAISON EN COURS"}
                </span>
                <h2>SHOWDOWN CLASSÉ</h2>
                <p>Matchs 5v5 compétitifs et duels 1v1 vérifiés.</p>
                <strong>RÉGION {backend.profile?.region ?? "EUW"}</strong>
                <b>
                  {backend.backendOnline ? "SERVICES EN LIGNE" : "CONNEXION…"}
                </b>
              </div>
            </Card>
            <Card className="home-rank-card">
              <span className="eyebrow">CLASSEMENT ACTUEL</span>
              <Image
                src={rankIcon(
                  backend.statistics?.rank,
                  backend.statistics?.games,
                )}
                alt="Classement actuel"
                width={94}
                height={94}
              />
              <h2>{fiveRankPresentation(backend.statistics).label}</h2>
              <b>{backend.statistics?.progression ?? 0} LP</b>
              <strong>
                {Math.round(backend.statistics?.winRate ?? 0)}%{" "}
                <small>VICTOIRES</small>
              </strong>
              <p>
                {backend.statistics?.wins ?? 0}W —{" "}
                {backend.statistics?.losses ?? 0}L
              </p>
              <Button kind="outline" onClick={() => go("leaderboard")}>
                VOIR LE CLASSEMENT
              </Button>
            </Card>
          </div>
          <div className="home-activity-row">
            <Card className="home-recent-card">
              <header>
                <h2>ACTIVITÉ RÉCENTE</h2>
                <button type="button" onClick={() => go("matches")}>
                  TOUT VOIR →
                </button>
              </header>
              <div>
                {liveMatches.length ? (
                  liveMatches.map((match, index) => (
                    <button
                      type="button"
                      className="home-activity-line"
                      key={match.matchId}
                      onClick={() => go("matches")}
                    >
                      <Image
                        src={`/champion-icons/${recentPortraits[index % recentPortraits.length]}.png`}
                        alt=""
                        aria-hidden="true"
                        width={34}
                        height={34}
                      />
                      <b
                        className={
                          match.outcome === "VICTORY" ? "positive" : "negative"
                        }
                      >
                        {match.outcome === "VICTORY" ? "VICTOIRE" : "DÉFAITE"}
                      </b>
                      <span>
                        {match.mode === "ONE_V_ONE"
                          ? "1V1 Glicko-2"
                          : "5V5 TrueSkill"}
                      </span>
                      <strong>
                        {match.role === "BOT" ? "ADC" : match.role}
                      </strong>
                      <b
                        className={
                          match.mmrDelta >= 0 ? "positive" : "negative"
                        }
                      >
                        {match.mmrDelta >= 0 ? "+" : ""}
                        {match.mmrDelta}
                      </b>
                      <small>{formatDate(match.playedAt)}</small>
                    </button>
                  ))
                ) : (
                  <EmptyState
                    title="Aucun match enregistré"
                    text="Lance une recherche pour commencer ton historique."
                    action={
                      <Button kind="outline" onClick={() => go("play")}>
                        TROUVER UN MATCH
                      </Button>
                    }
                  />
                )}
              </div>
            </Card>
            <Card className="home-queue-card">
              <header>
                <h2>ÉTAT EN DIRECT</h2>
                <span aria-hidden="true">›</span>
              </header>
              <div className="queue-status">
                <Image
                  src="/mode-icons/summoners-rift-active.png"
                  alt=""
                  aria-hidden="true"
                  width={48}
                  height={48}
                />
                <span>
                  <strong>
                    {backend.lobby
                      ? "LOBBY PRÊT"
                      : backend.match
                        ? "CONFIRMATION"
                        : backend.queue
                          ? "RECHERCHE EN COURS"
                          : "HORS FILE"}
                  </strong>
                  <small>
                    {backend.queue
                      ? `${backend.queue.mode === "ONE_V_ONE" ? "1V1" : "5V5"} · ${backend.queue.region}`
                      : "Choisis un mode pour commencer."}
                  </small>
                </span>
              </div>
              <Button
                kind="outline"
                onClick={() =>
                  go(
                    backend.lobby
                      ? "lobby"
                      : backend.match
                        ? "ready"
                        : backend.queue
                          ? "searching"
                          : "play",
                  )
                }
              >
                {backend.queue || backend.match || backend.lobby
                  ? "OUVRIR LE MATCH"
                  : "TROUVER UN MATCH"}
              </Button>
            </Card>
          </div>
        </section>
      </div>
    </Localized>
  );
}
