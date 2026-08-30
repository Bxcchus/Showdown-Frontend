"use client";

import Image from "next/image";
import { type KeyboardEvent, useEffect, useState } from "react";
import { Button, Card, EmptyState, PageTitle } from "../components/ui";
import { useBackend } from "../lib/backend";
import { Localized, useLanguage } from "../lib/i18n";
import { rankIcon } from "../lib/presentation";

type LeaderboardCategory = "1V1 GLICKO-2" | "5V5 TRUESKILL";
const leaderboardCategories: LeaderboardCategory[] = [
  "1V1 GLICKO-2",
  "5V5 TRUESKILL",
];

function leaderboardTabId(category: LeaderboardCategory) {
  return `leaderboard-tab-${category === "1V1 GLICKO-2" ? "1v1" : "5v5"}`;
}

export default function LeaderboardPage() {
  const backend = useBackend();
  const { formatDate, formatNumber } = useLanguage();
  const [category, setCategory] = useState<LeaderboardCategory>(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("mode") === "5v5"
      ? "5V5 TRUESKILL"
      : "1V1 GLICKO-2",
  );
  const changeCategory = (value: LeaderboardCategory) => {
    setCategory(value);
    const url = new URL(window.location.href);
    url.searchParams.set("mode", value === "1V1 GLICKO-2" ? "1v1" : "5v5");
    window.history.pushState(
      window.history.state,
      "",
      `${url.pathname}${url.search}`,
    );
  };
  useEffect(() => {
    const syncCategory = () =>
      setCategory(
        new URLSearchParams(window.location.search).get("mode") === "5v5"
          ? "5V5 TRUESKILL"
          : "1V1 GLICKO-2",
      );
    window.addEventListener("popstate", syncCategory);
    return () => window.removeEventListener("popstate", syncCategory);
  }, []);
  const moveCategoryTab = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const nextIndex =
      event.key === "ArrowRight"
        ? (index + 1) % leaderboardCategories.length
        : event.key === "ArrowLeft"
          ? (index - 1 + leaderboardCategories.length) %
            leaderboardCategories.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? leaderboardCategories.length - 1
              : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    changeCategory(leaderboardCategories[nextIndex]);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      .item(nextIndex)
      .focus();
  };
  const activeSnapshot =
    category === "1V1 GLICKO-2"
      ? backend.duelLeaderboardSnapshot
      : backend.fiveLeaderboardSnapshot;
  const apiEntries = activeSnapshot?.entries ?? [];
  const rows = apiEntries.map((entry) => ({
    id: entry.playerId,
    name:
      backend.playerNames[entry.playerId] ??
      `Joueur ${entry.playerId.slice(0, 6)}`,
    rating: formatNumber(entry.mmr),
    record: `${entry.wins} — ${Math.max(0, entry.games - entry.wins)}`,
    winRate: `${Math.round(entry.winRate)}%`,
    position: entry.position,
    games: entry.games,
    provisional: entry.provisional ?? false,
    tier:
      entry.rank ?? (category === "1V1 GLICKO-2" ? "Glicko-2" : "TrueSkill"),
  }));
  const rawViewer = activeSnapshot?.viewer ?? null;
  const myEntry = rawViewer
    ? {
        id: rawViewer.playerId,
        rating: formatNumber(rawViewer.mmr),
        record: `${rawViewer.wins} — ${Math.max(0, rawViewer.games - rawViewer.wins)}`,
        winRate: `${Math.round(rawViewer.winRate)}%`,
        position: rawViewer.position,
        games: rawViewer.games,
        provisional: rawViewer.provisional ?? false,
        tier:
          rawViewer.rank ??
          (category === "1V1 GLICKO-2" ? "Glicko-2" : "TrueSkill"),
      }
    : undefined;
  const myPosition = myEntry?.position ?? 0;
  const isMe = (id: string) => id === backend.session?.playerId;
  const activeSeason = backend.ratingSeasons.find(
    (season) => season.code === activeSnapshot?.season,
  );
  const totalEntries = activeSnapshot?.totalEntries ?? 0;
  return (
    <div className="page leaderboard-page">
      <PageTitle
        eyebrow={activeSnapshot?.season ?? "SAISON EN COURS"}
        title="CLASSEMENT"
        text={`Les meilleurs joueurs GYMS.LOL de la région ${backend.leaderboardRegion}.`}
        action={
          !backend.session ? (
            <Button onClick={() => void backend.login()}>
              SE CONNECTER POUR LES DONNÉES EN DIRECT
            </Button>
          ) : (
            <label className="leaderboard-region-select">
              RÉGION
              <select
                value={backend.leaderboardRegion}
                disabled={backend.leaderboardStatus === "LOADING"}
                onChange={(event) =>
                  void backend.loadLeaderboards(event.target.value)
                }
              >
                <option value="EUW">EUW</option>
                <option value="EUNE">EUNE</option>
                <option value="NA">NA</option>
              </select>
            </label>
          )
        }
      />
      <div className="leaderboard-overview">
        <Card className="leaderboard-position">
          <Image
            src={
              myEntry
                ? category === "1V1 GLICKO-2"
                  ? myEntry.provisional || myEntry.games === 0
                    ? "/rank-icons/unranked.png"
                    : "/rank-icons/diamond.png"
                  : rankIcon(myEntry.tier, myEntry.games)
                : "/rank-icons/unranked.png"
            }
            alt="Classement actuel"
            width={104}
            height={104}
          />
          <span>
            <small>TA POSITION</small>
            <strong>
              #{myPosition ? String(myPosition).padStart(2, "0") : "—"}
            </strong>
            <b>{backend.leaderboardRegion} · CLASSEMENT ACTIF</b>
          </span>
        </Card>
        <Card className="leaderboard-stats">
          <span>
            <small>
              {category === "1V1 GLICKO-2"
                ? "ÉVALUATION ACTUELLE"
                : "NIVEAU ACTUEL"}
            </small>
            <strong>{myEntry?.rating ?? "—"}</strong>
            <b>EN DIRECT</b>
          </span>
          <span>
            <small>BILAN DE SAISON</small>
            <strong>{myEntry?.record ?? "—"}</strong>
            <b>{myEntry?.games ?? 0} MATCHS</b>
          </span>
          <span>
            <small>TAUX DE VICTOIRE</small>
            <strong>{myEntry?.winRate ?? "—"}</strong>
            <b className="positive">ACTUEL</b>
          </span>
        </Card>
        <Card className="leaderboard-season">
          <small>{activeSnapshot?.season ?? "SAISON"}</small>
          <strong>{totalEntries}</strong>
          <span>
            {totalEntries} JOUEURS CLASSÉS ·{" "}
            {activeSnapshot?.placementGames ?? 5} PLACEMENTS
          </span>
          {activeSnapshot && (
            <span>
              {formatDate(activeSnapshot.startsAt)} →{" "}
              {formatDate(activeSnapshot.endsAt)}
            </span>
          )}
          <b className={totalEntries ? "positive" : ""}>
            {totalEntries ? "SAISON ACTIVE" : "EN ATTENTE DE RÉSULTATS"}
          </b>
          {activeSeason && (
            <small>
              RÉINITIALISATION PARTIELLE :{" "}
              {Math.round(activeSeason.resetFactor * 100)} % CONSERVÉS
            </small>
          )}
        </Card>
      </div>
      <Localized>
        <div className="tabs" role="tablist" aria-label="Type de classement">
          {leaderboardCategories.map((item, index) => (
            <button
              type="button"
              role="tab"
              id={leaderboardTabId(item)}
              aria-controls="leaderboard-panel"
              aria-selected={category === item}
              tabIndex={category === item ? 0 : -1}
              className={category === item ? "active" : ""}
              onClick={() => changeCategory(item)}
              onKeyDown={(event) => moveCategoryTab(event, index)}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
        <div
          id="leaderboard-panel"
          role="tabpanel"
          aria-labelledby={leaderboardTabId(category)}
          aria-busy={backend.leaderboardStatus === "LOADING"}
          tabIndex={0}
        >
          {rows.length ? (
            <table className="leaderboard-table">
              <caption className="sr-only">Classement régional</caption>
              <thead>
                <tr className="leaderboard-head">
                  <th scope="col">#</th>
                  <th scope="col">JOUEUR</th>
                  <th scope="col">
                    {category === "1V1 GLICKO-2" ? "ÉVALUATION" : "NIVEAU"}
                  </th>
                  <th scope="col">BILAN</th>
                  <th scope="col">VICTOIRES</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const playerIcon =
                    category === "1V1 GLICKO-2"
                      ? row.provisional
                        ? "/rank-icons/unranked.png"
                        : "/mode-icons/aram-active.png"
                      : rankIcon(row.tier, row.games);
                  return (
                    <tr
                      className={`leaderboard-row${isMe(row.id) ? " is-you" : ""}`}
                      key={row.id}
                    >
                      <th scope="row">
                        {String(row.position).padStart(2, "0")}
                      </th>
                      <td className="leaderboard-player">
                        <Image
                          src={playerIcon}
                          alt=""
                          aria-hidden="true"
                          width={40}
                          height={40}
                        />
                        <span>
                          <strong>
                            {row.name}
                            {isMe(row.id) && <small>TOI</small>}
                          </strong>
                          <b>
                            {row.tier} · {backend.leaderboardRegion}
                          </b>
                        </span>
                      </td>
                      <td>{row.rating}</td>
                      <td>{row.record}</td>
                      <td className="positive">{row.winRate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <EmptyState
              title={
                backend.leaderboardStatus === "LOADING"
                  ? "Chargement du classement"
                  : backend.leaderboardStatus === "ERROR"
                    ? "Classement indisponible"
                    : backend.session
                      ? "Aucun joueur classé"
                      : "Classement réservé aux membres"
              }
              text={
                backend.leaderboardStatus === "LOADING"
                  ? `Synchronisation des données ${backend.leaderboardRegion}…`
                  : backend.leaderboardStatus === "ERROR"
                    ? (backend.leaderboardError ??
                      "Réessaie dans quelques instants.")
                    : backend.session
                      ? "Le classement se remplira dès que des matchs classés seront terminés."
                      : "Connecte-toi pour charger le classement régional en direct."
              }
              action={
                backend.leaderboardStatus === "ERROR" && backend.session ? (
                  <Button
                    onClick={() =>
                      void backend.loadLeaderboards(backend.leaderboardRegion)
                    }
                  >
                    RÉESSAYER
                  </Button>
                ) : !backend.session ? (
                  <Button onClick={() => void backend.login()}>
                    SE CONNECTER
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>
      </Localized>
    </div>
  );
}
