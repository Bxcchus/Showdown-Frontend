"use client";

import Image from "next/image";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button, Card, EmptyState, PageTitle } from "../components/ui";
import { useBackend, type ApiRole, type MatchDetail } from "../lib/backend";
import {
  historyFiltersFromQuery,
  historyMode,
  type HistoryFilter,
  type HistorySearchFilters,
} from "../lib/flow";
import { Localized, useLanguage } from "../lib/i18n";
import { championIconUrl } from "../lib/presentation";

function writeHistoryUrl(
  next: HistorySearchFilters,
  method: "pushState" | "replaceState",
  matchId?: string,
) {
  const url = new URL(window.location.href);
  if (next.mode === "ALL") url.searchParams.delete("mode");
  else
    url.searchParams.set("mode", next.mode === "1V1 GLICKO-2" ? "1v1" : "5v5");
  for (const key of ["region", "role", "outcome"] as const) {
    if (next[key]) url.searchParams.set(key, next[key].toLowerCase());
    else url.searchParams.delete(key);
  }
  if (next.page > 1) url.searchParams.set("page", String(next.page));
  else url.searchParams.delete("page");
  if (matchId) url.searchParams.set("match", matchId);
  else url.searchParams.delete("match");
  window.history[method](
    window.history.state,
    "",
    `${url.pathname}${url.search}`,
  );
}

function historyTabId(mode: HistoryFilter) {
  return `history-tab-${mode.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`;
}

function itemIconUrl(itemId: number) {
  return `https://ddragon.leagueoflegends.com/cdn/16.16.1/img/item/${itemId}.png`;
}

export default function HistoryPage() {
  const backend = useBackend();
  const loadHistory = backend.loadHistory;
  const loadMatchDetail = backend.loadMatchDetail;
  const sessionPlayerId = backend.session?.playerId;
  const { formatDate, formatTime } = useLanguage();
  const [filters, setFilters] = useState<HistorySearchFilters>(() =>
    typeof window === "undefined"
      ? { mode: "ALL", region: "", role: "", outcome: "", page: 1 }
      : historyFiltersFromQuery(window.location.search),
  );
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const detailRequest = useRef(0);
  const displayRoles: ApiRole[] = ["TOP", "JUNGLE", "MID", "BOT", "SUPPORT"];
  const roleIcon = (role: ApiRole) =>
    `/role-icons/${role === "BOT" ? "adc" : role.toLowerCase()}.svg`;
  const roleLabel = (role: ApiRole) => (role === "BOT" ? "ADC" : role);
  const requestHistory = useCallback(
    async (next: HistorySearchFilters) => {
      const result = await loadHistory(next.page - 1, {
        mode: historyMode(next.mode),
        region: next.region,
        role: next.role,
        outcome: next.outcome,
      });
      if (result && result.page + 1 !== next.page) {
        const canonical = { ...next, page: result.page + 1 };
        setFilters(canonical);
        writeHistoryUrl(canonical, "replaceState");
      }
      return result;
    },
    [loadHistory],
  );
  const loadDetail = useCallback(
    async (matchId: string) => {
      const sequence = ++detailRequest.current;
      setDetail(null);
      setDetailError(null);
      setDetailLoadingId(matchId);
      const value = await loadMatchDetail(matchId);
      if (sequence !== detailRequest.current) return;
      setDetailLoadingId(null);
      if (value) setDetail(value);
      else setDetailError("Le détail de ce match n’est pas disponible.");
    },
    [loadMatchDetail],
  );
  const changeFilters = (next: HistorySearchFilters) => {
    const normalized = { ...next, page: 1 };
    setFilters(normalized);
    setDetail(null);
    setDetailLoadingId(null);
    setDetailError(null);
    detailRequest.current += 1;
    writeHistoryUrl(normalized, "replaceState");
    void requestHistory(normalized);
  };
  useEffect(() => {
    if (!sessionPlayerId) return;
    const syncFromUrl = () => {
      const nextFilters = historyFiltersFromQuery(window.location.search);
      const matchId = new URLSearchParams(window.location.search).get("match");
      setFilters(nextFilters);
      void requestHistory(nextFilters);
      if (matchId) {
        void loadDetail(matchId);
      } else {
        detailRequest.current += 1;
        setDetail(null);
        setDetailLoadingId(null);
        setDetailError(null);
      }
      const savedScroll = (window.history.state as { gymsLolScrollY?: number })
        ?.gymsLolScrollY;
      if (typeof savedScroll === "number")
        window.requestAnimationFrame(() => window.scrollTo(0, savedScroll));
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [loadDetail, requestHistory, sessionPlayerId]);
  const openDetail = async (matchId: string) => {
    if (detail?.summary.matchId === matchId) {
      if (window.history.state?.gymsLolHistoryDetail === matchId) {
        window.history.back();
      } else {
        setDetail(null);
        setDetailLoadingId(null);
        setDetailError(null);
        detailRequest.current += 1;
        const url = new URL(window.location.href);
        url.searchParams.delete("match");
        window.history.replaceState(
          { ...window.history.state, gymsLolHistoryDetail: undefined },
          "",
          `${url.pathname}${url.search}`,
        );
      }
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("match", matchId);
    const scrollY = window.scrollY;
    window.history.replaceState(
      { ...window.history.state, gymsLolScrollY: scrollY },
      "",
      window.location.href,
    );
    window.history.pushState(
      {
        ...window.history.state,
        gymsLolHistoryDetail: matchId,
        gymsLolScrollY: scrollY,
      },
      "",
      `${url.pathname}${url.search}`,
    );
    await loadDetail(matchId);
  };
  const changePage = (page: number) => {
    const next = { ...filters, page: page + 1 };
    setFilters(next);
    setDetail(null);
    setDetailLoadingId(null);
    setDetailError(null);
    detailRequest.current += 1;
    writeHistoryUrl(next, "pushState");
    void requestHistory(next);
  };
  const moveModeTab = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const modes: HistoryFilter[] = ["ALL", "1V1 GLICKO-2", "5V5 TRUESKILL"];
    const nextIndex =
      event.key === "ArrowRight"
        ? (index + 1) % modes.length
        : event.key === "ArrowLeft"
          ? (index - 1 + modes.length) % modes.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? modes.length - 1
              : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    changeFilters({ ...filters, mode: modes[nextIndex] });
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      .item(nextIndex)
      .focus();
  };
  return (
    <div className="page matches-page">
      <PageTitle
        eyebrow="PARCOURS COMPÉTITIF"
        title="HISTORIQUE"
        text={
          backend.session
            ? `${backend.historyPage?.totalElements ?? backend.history.length} parties enregistrées par GYMS.LOL.`
            : "Connecte-toi pour charger tes parties compétitives."
        }
        action={
          !backend.session ? (
            <Button onClick={() => void backend.login()}>SE CONNECTER</Button>
          ) : undefined
        }
      />
      <Localized>
        <div className="tabs" role="tablist" aria-label="Mode de l’historique">
          {(["ALL", "1V1 GLICKO-2", "5V5 TRUESKILL"] as HistoryFilter[]).map(
            (item, index) => (
              <button
                type="button"
                role="tab"
                id={historyTabId(item)}
                aria-controls="history-panel"
                aria-selected={filters.mode === item}
                tabIndex={filters.mode === item ? 0 : -1}
                className={filters.mode === item ? "active" : ""}
                onClick={() => changeFilters({ ...filters, mode: item })}
                onKeyDown={(event) => moveModeTab(event, index)}
                key={item}
              >
                {item === "ALL" ? "TOUTES" : item}
              </button>
            ),
          )}
        </div>
        <div
          id="history-panel"
          role="tabpanel"
          aria-labelledby={historyTabId(filters.mode)}
          aria-busy={backend.historyStatus === "LOADING"}
          tabIndex={0}
        >
          <fieldset className="history-filters">
            <legend className="sr-only">Filtres de l’historique</legend>
            <label>
              RÉGION
              <select
                value={filters.region}
                onChange={(event) =>
                  changeFilters({
                    ...filters,
                    region: event.target
                      .value as HistorySearchFilters["region"],
                  })
                }
              >
                <option value="">TOUTES</option>
                <option value="EUW">EUW</option>
                <option value="EUNE">EUNE</option>
                <option value="NA">NA</option>
              </select>
            </label>
            <label>
              RÔLE
              <select
                value={filters.role}
                onChange={(event) =>
                  changeFilters({
                    ...filters,
                    role: event.target.value as HistorySearchFilters["role"],
                  })
                }
              >
                <option value="">TOUS</option>
                {displayRoles.map((role) => (
                  <option value={role} key={role}>
                    {role === "BOT" ? "ADC" : role}
                  </option>
                ))}
              </select>
            </label>
            <label>
              RÉSULTAT
              <select
                value={filters.outcome}
                onChange={(event) =>
                  changeFilters({
                    ...filters,
                    outcome: event.target
                      .value as HistorySearchFilters["outcome"],
                  })
                }
              >
                <option value="">TOUS</option>
                <option value="VICTORY">VICTOIRES</option>
                <option value="DEFEAT">DÉFAITES</option>
              </select>
            </label>
          </fieldset>
          {backend.historyStatus === "LOADING" && (
            <p className="status-line" role="status" aria-live="polite">
              ACTUALISATION DE L’HISTORIQUE…
            </p>
          )}
          {backend.historyError && (
            <div role="alert">
              <Card className="history-empty">
                <EmptyState
                  title="Historique momentanément indisponible"
                  text={backend.historyError}
                  action={
                    <Button
                      kind="outline"
                      onClick={() => void requestHistory(filters)}
                    >
                      RÉESSAYER
                    </Button>
                  }
                />
              </Card>
            </div>
          )}
          {detailError && (
            <p className="status-line" role="alert">
              {detailError}
            </p>
          )}
          <div className="history-list">
            {backend.history.length ? (
              backend.history.map((entry) => {
                const won = entry.outcome === "VICTORY";
                const played = new Date(entry.playedAt);
                const championIcon = championIconUrl(entry.championName);
                const hasKda = [entry.kills, entry.deaths, entry.assists].every(
                  (value) => Number.isInteger(value),
                );
                const itemIds = (entry.itemIds ?? []).slice(0, 7);
                const selected =
                  detail?.summary.matchId === entry.matchId ||
                  detailLoadingId === entry.matchId;
                return (
                  <article
                    className={`history-entry ${won ? "history-entry--win" : "history-entry--loss"}${selected ? " is-open" : ""}`}
                    key={entry.matchId}
                    aria-labelledby={`match-title-${entry.matchId}`}
                  >
                    <h2 className="sr-only" id={`match-title-${entry.matchId}`}>
                      {won ? "Victoire" : "Défaite"} du {formatDate(played)}
                    </h2>
                    <button
                      type="button"
                      className="history-entry-main"
                      onClick={() => void openDetail(entry.matchId)}
                      aria-expanded={selected}
                      aria-controls={`match-detail-${entry.matchId}`}
                      aria-labelledby={`match-title-${entry.matchId}`}
                      aria-busy={detailLoadingId === entry.matchId}
                    >
                      <span className="history-role-emblem">
                        <Image
                          className={
                            championIcon
                              ? "history-champion-icon"
                              : "history-mode-icon"
                          }
                          src={
                            championIcon ??
                            (entry.mode === "ONE_V_ONE"
                              ? "/mode-icons/aram-active.png"
                              : "/mode-icons/summoners-rift-active.png")
                          }
                          unoptimized={Boolean(championIcon)}
                          alt={
                            entry.championName
                              ? `Champion joué : ${entry.championName}`
                              : "Champion non enregistré"
                          }
                          width={70}
                          height={70}
                        />
                        <span>{entry.newMmr}</span>
                      </span>
                      <span className="history-result">
                        <strong>{won ? "VICTOIRE" : "DÉFAITE"}</strong>
                        <span>
                          {entry.mode === "ONE_V_ONE"
                            ? "Duel classé · Glicko-2"
                            : "Classé 5v5 · TrueSkill"}
                        </span>
                        <small>
                          {entry.region} ·{" "}
                          {entry.role === "BOT" ? "ADC" : entry.role}
                        </small>
                      </span>
                      <span className="history-rating">
                        <span>
                          <small>AVANT</small>
                          <strong>{entry.previousMmr}</strong>
                        </span>
                        <span
                          className={
                            entry.mmrDelta >= 0 ? "positive" : "negative"
                          }
                        >
                          <small>
                            {entry.mmrDelta >= 0 ? "GAIN" : "PERTE"}
                          </small>
                          <strong>
                            {entry.mmrDelta >= 0 ? "+" : ""}
                            {entry.mmrDelta}
                          </strong>
                        </span>
                        <span>
                          <small>ACTUEL</small>
                          <strong>{entry.newMmr}</strong>
                        </span>
                      </span>
                      <span className="history-performance">
                        <Image
                          className="history-performance-map"
                          src={
                            entry.mode === "ONE_V_ONE"
                              ? "/mode-icons/aram-active.png"
                              : "/mode-icons/summoners-rift-active.png"
                          }
                          alt={
                            entry.mode === "ONE_V_ONE"
                              ? "Carte : Abîme hurlant"
                              : "Carte : Faille de l’invocateur"
                          }
                          width={42}
                          height={42}
                        />
                        <span className="history-kda">
                          <small>KDA</small>
                          <strong>
                            {hasKda
                              ? `${entry.kills} / ${entry.deaths} / ${entry.assists}`
                              : "— / — / —"}
                          </strong>
                        </span>
                        <span
                          className="history-items"
                          aria-label="Objets achetés en jeu"
                        >
                          {Array.from({ length: 7 }, (_, index) => {
                            const itemId = itemIds[index];
                            return itemId ? (
                              <Image
                                key={`${itemId}-${index}`}
                                src={itemIconUrl(itemId)}
                                unoptimized
                                alt={`Objet ${itemId}`}
                                width={28}
                                height={28}
                              />
                            ) : (
                              <i key={`empty-${index}`} aria-hidden="true" />
                            );
                          })}
                        </span>
                      </span>
                      <time className="history-when" dateTime={entry.playedAt}>
                        <strong>{formatDate(played)}</strong>
                        <span>{formatTime(played)}</span>
                        <small>
                          #{entry.matchId.slice(0, 8).toUpperCase()}
                        </small>
                      </time>
                      <span className="history-expand" aria-hidden="true">
                        {selected ? "−" : "+"}
                      </span>
                    </button>
                    {selected && detail && (
                      <div
                        className="history-detail"
                        id={`match-detail-${entry.matchId}`}
                        role="region"
                        aria-labelledby={`match-title-${entry.matchId}`}
                        aria-live="polite"
                      >
                        <section>
                          <h3>ÉQUIPE</h3>
                          {detail.teammates.map((player) => (
                            <p key={player.playerId}>
                              <strong>
                                {player.bot
                                  ? "GYMS.LOL BOT"
                                  : (backend.playerNames[player.playerId] ??
                                    player.playerId.slice(0, 8))}
                              </strong>
                              <span className="history-detail-role">
                                <Image
                                  src={roleIcon(player.role)}
                                  alt={`Rôle : ${roleLabel(player.role)}`}
                                  width={24}
                                  height={24}
                                />
                              </span>
                            </p>
                          ))}
                        </section>
                        <section>
                          <h3>ADVERSAIRES</h3>
                          {detail.opponents.map((player) => (
                            <p key={player.playerId}>
                              <strong>
                                {player.bot
                                  ? "GYMS.LOL BOT"
                                  : (backend.playerNames[player.playerId] ??
                                    player.playerId.slice(0, 8))}
                              </strong>
                              <span className="history-detail-role">
                                <Image
                                  src={roleIcon(player.role)}
                                  alt={`Rôle : ${roleLabel(player.role)}`}
                                  width={24}
                                  height={24}
                                />
                              </span>
                            </p>
                          ))}
                        </section>
                        <aside>
                          <small>RÉSULTAT MMR</small>
                          <strong
                            className={
                              entry.mmrDelta >= 0 ? "positive" : "negative"
                            }
                          >
                            {entry.mmrDelta >= 0 ? "+" : ""}
                            {entry.mmrDelta}
                          </strong>
                          <span>
                            {entry.previousMmr} → {entry.newMmr}
                          </span>
                          <div className="history-detail-performance">
                            <small>KDA</small>
                            <strong>
                              {hasKda
                                ? `${entry.kills} / ${entry.deaths} / ${entry.assists}`
                                : "— / — / —"}
                            </strong>
                            <div aria-label="Objets achetés en jeu">
                              {Array.from({ length: 7 }, (_, index) => {
                                const itemId = itemIds[index];
                                return itemId ? (
                                  <Image
                                    key={`${itemId}-${index}`}
                                    src={itemIconUrl(itemId)}
                                    unoptimized
                                    alt={`Objet ${itemId}`}
                                    width={30}
                                    height={30}
                                  />
                                ) : (
                                  <i
                                    key={`empty-${index}`}
                                    aria-hidden="true"
                                  />
                                );
                              })}
                            </div>
                          </div>
                          {!hasKda && !itemIds.length && (
                            <p>
                              Données de partie indisponibles pour cet ancien
                              match.
                            </p>
                          )}
                        </aside>
                      </div>
                    )}
                    {detailLoadingId === entry.matchId && (
                      <div
                        className="history-detail"
                        id={`match-detail-${entry.matchId}`}
                        role="status"
                      >
                        CHARGEMENT DU DÉTAIL…
                      </div>
                    )}
                  </article>
                );
              })
            ) : backend.historyStatus !== "LOADING" && !backend.historyError ? (
              <Card className="history-empty">
                <EmptyState
                  title={
                    backend.session
                      ? "Aucun match trouvé"
                      : "Ton historique t’attend"
                  }
                  text={
                    backend.session
                      ? "Modifie le filtre ou termine un nouveau match classé."
                      : "Connecte-toi pour retrouver tes duels, tes équipes et ton évolution MMR."
                  }
                  action={
                    !backend.session ? (
                      <Button onClick={() => void backend.login()}>
                        SE CONNECTER
                      </Button>
                    ) : undefined
                  }
                />
              </Card>
            ) : null}
          </div>
          {backend.historyPage && backend.historyPage.totalPages > 1 && (
            <nav className="pagination" aria-label="Pagination de l’historique">
              <Button
                kind="outline"
                disabled={
                  !backend.historyPage.hasPrevious ||
                  backend.historyStatus === "LOADING"
                }
                onClick={() => changePage(backend.historyPage!.page - 1)}
              >
                PRÉCÉDENT
              </Button>
              <span>
                PAGE {backend.historyPage.page + 1} /{" "}
                {backend.historyPage.totalPages}
              </span>
              <Button
                kind="outline"
                disabled={
                  !backend.historyPage.hasNext ||
                  backend.historyStatus === "LOADING"
                }
                onClick={() => changePage(backend.historyPage!.page + 1)}
              >
                SUIVANT
              </Button>
            </nav>
          )}
        </div>
      </Localized>
    </div>
  );
}
