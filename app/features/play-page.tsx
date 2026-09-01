"use client";

import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { Button, Card, EmptyState } from "../components/ui";
import { useBackend, type ApiRole } from "../lib/backend";
import { Localized, useLanguage } from "../lib/i18n";
import type { Page } from "../lib/navigation";
import {
  duelRankPresentation,
  fiveRankPresentation,
  rankIcon,
  watcherPresentation,
} from "../lib/presentation";
import {
  ModePicker,
  PLAY_MODES,
  RolePicker,
  type PlayMode,
  type Role,
} from "./play-controls";

export function Play({ go }: { go: (page: Page) => void }) {
  const backend = useBackend();
  const { language } = useLanguage();
  const readRequestedMode = () => {
    if (typeof window === "undefined") return "1V1" as const;
    const queryMode = new URLSearchParams(window.location.search).get("mode");
    if (queryMode === "5v5") return "5V5" as const;
    if (queryMode === "1v1") return "1V1" as const;
    try {
      return window.localStorage.getItem("gyms-lol.quick-mode") === "5V5"
        ? ("5V5" as const)
        : ("1V1" as const);
    } catch {
      return "1V1" as const;
    }
  };
  const [mode, setModeState] = useState<PlayMode>(readRequestedMode);
  const [primary, setPrimary] = useState<Role>("MID");
  const [secondary, setSecondary] = useState<Role>("JUNGLE");
  const [inviteName, setInviteName] = useState("");
  const rolesHydrated = useRef(false);
  const setMode = (nextMode: PlayMode) => {
    setModeState(nextMode);
    try {
      window.localStorage.setItem("gyms-lol.quick-mode", nextMode);
    } catch {
      /* URL state remains authoritative. */
    }
    const url = new URL(window.location.href);
    url.searchParams.set("mode", nextMode.toLowerCase());
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}`,
    );
  };
  useEffect(() => {
    const syncMode = () => setModeState(readRequestedMode());
    window.addEventListener("popstate", syncMode);
    return () => window.removeEventListener("popstate", syncMode);
  }, []);
  useEffect(() => {
    if (!backend.profile || rolesHydrated.current) return;
    const displayRole = (role: ApiRole): Role =>
      role === "BOT" ? "ADC" : role;
    setPrimary(displayRole(backend.profile.primaryRole));
    setSecondary(displayRole(backend.profile.secondaryRole));
    rolesHydrated.current = true;
  }, [backend.profile]);
  const selectedMode =
    PLAY_MODES.find((item) => item.id === mode) ?? PLAY_MODES[0];
  const choosePrimary = (role: Role) => {
    if (role === secondary) {
      setSecondary(primary);
    }
    setPrimary(role);
  };
  const chooseSecondary = (role: Role) => {
    if (role === primary) {
      setPrimary(secondary);
    }
    setSecondary(role);
  };
  const apiRole = (role: Role): ApiRole => (role === "ADC" ? "BOT" : role);
  const findMatch = async () => {
    if (
      mode === "1V1" &&
      (!backend.watcherOnline || !backend.profile?.riotId)
    ) {
      go(backend.watcherOnline ? "duels" : "download");
      return;
    }
    if (mode === "5V5" && backend.profile) {
      const nextPrimary = apiRole(primary);
      const nextSecondary = apiRole(secondary);
      if (
        backend.profile.primaryRole !== nextPrimary ||
        backend.profile.secondaryRole !== nextSecondary
      ) {
        const saved = await backend.updateProfile({
          displayName: backend.profile.displayName,
          region: backend.profile.region,
          primaryRole: nextPrimary,
          secondaryRole: nextSecondary,
        });
        if (!saved) return;
      }
    }
    const joined = await backend.joinQueue(
      mode === "1V1" ? "ONE_V_ONE" : "FIVE_V_FIVE",
      apiRole(primary),
      apiRole(secondary),
    );
    if (joined) go("searching");
  };
  const members = backend.party?.members;
  const me = members?.find(
    (member) => member.playerId === backend.session?.playerId,
  );
  const togglePartyReady = async () => {
    if (!me) return;
    if (!me.ready && mode === "5V5" && backend.profile) {
      const saved = await backend.updateProfile({
        displayName: backend.profile.displayName,
        region: backend.profile.region,
        primaryRole: apiRole(primary),
        secondaryRole: apiRole(secondary),
      });
      if (!saved) return;
    }
    await backend.setPartyReady(!me.ready);
  };
  const submitInvite = async (event: FormEvent) => {
    event.preventDefault();
    if (await backend.invitePlayer(inviteName.trim())) setInviteName("");
  };
  const liveParty = members?.length ? (
    <div className="party-rows compact">
      {members.map((member) => {
        const isMe = member.playerId === backend.session?.playerId;
        const isLeader = member.playerId === backend.party?.leaderId;
        return (
          <div className="party-row" key={member.playerId}>
            <strong>
              {member.displayName}
              {isMe && <small>TOI</small>}
              {isLeader && <small>CHEF</small>}
            </strong>
            <span>
              {member.primaryRole === "BOT" ? "ADC" : member.primaryRole} →{" "}
              {member.secondaryRole === "BOT" ? "ADC" : member.secondaryRole}
            </span>
            <b className={member.ready ? "positive" : ""}>
              {member.ready
                ? "PRÊT"
                : member.online
                  ? "EN LIGNE"
                  : "HORS LIGNE"}
            </b>
            {backend.party?.viewerIsLeader && !isMe && (
              <button
                type="button"
                className="party-remove"
                aria-label={`Retirer ${member.displayName} du groupe`}
                onClick={() => void backend.removePartyMember(member.playerId)}
              >
                RETIRER
              </button>
            )}
          </div>
        );
      })}
    </div>
  ) : (
    <EmptyState
      title="Aucun groupe"
      text="Crée un groupe pour inviter des joueurs et lancer une recherche commune."
    />
  );
  const fiveRank = fiveRankPresentation(backend.statistics);
  const duelRank = duelRankPresentation(backend.duelStatistics).label;
  const selectedRank = mode === "1V1" ? duelRank : fiveRank.label;
  const selectedMmr =
    mode === "1V1" ? backend.duelStatistics?.mmr : backend.statistics?.mmr;
  const selectedMmrLabel = selectedMmr == null ? "—" : `${selectedMmr} MMR`;
  const selectedGames =
    mode === "1V1"
      ? (backend.duelStatistics?.games ?? 0)
      : (backend.statistics?.games ?? 0);
  const recentResults = backend.recentHistory
    .filter((match) =>
      mode === "1V1"
        ? match.mode === "ONE_V_ONE"
        : match.mode === "FIVE_V_FIVE",
    )
    .slice(0, 5);
  const region = backend.party?.region ?? backend.profile?.region ?? "EUW";
  const readyMembers = members?.filter((member) => member.ready).length ?? 0;
  const watcher = watcherPresentation(
    backend.watcherOnline,
    backend.watcherJob,
  );
  return (
    <Localized>
      <div className="page play-page">
        <div className="play-shell-grid">
          <Card className="play-config">
            <div className="play-config-head">
              <span className="eyebrow">FILE COMPÉTITIVE</span>
              <h1 tabIndex={-1}>{selectedMode.title}</h1>
              <p>
                {mode === "1V1"
                  ? "Un duel vérifié décidé au premier sang, aux 100 CS ou à la première tourelle."
                  : "Ton rôle principal reste prioritaire avant l’élargissement de la recherche."}
              </p>
            </div>
            <ModePicker mode={mode} onChange={setMode} />
            <div className="queue-mode-content">
              {mode === "5V5" ? (
                <>
                  <RolePicker
                    label="RÔLE PRINCIPAL"
                    value={primary}
                    onChange={choosePrimary}
                  />
                  <RolePicker
                    label="RÔLE SECONDAIRE"
                    value={secondary}
                    onChange={chooseSecondary}
                  />
                  <div className="queue-summary-grid queue-summary-grid--five">
                    <span>
                      <small>REGION</small>
                      <strong>{region}</strong>
                    </span>
                    <span>
                      <small>ÉVALUATION</small>
                      <strong>{selectedMmrLabel}</strong>
                    </span>
                    <span>
                      <small>ORDRE DES RÔLES</small>
                      <strong>
                        {primary} → {secondary}
                      </strong>
                    </span>
                    <span>
                      <small>GROUPE</small>
                      <strong>
                        {backend.party
                          ? `${readyMembers} / ${members?.length ?? 0} PRÊTS`
                          : "1 / 1 PRÊT"}
                      </strong>
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="queue-summary-grid">
                    <span>
                      <small>REGION</small>
                      <strong>{region}</strong>
                    </span>
                    <span>
                      <small>GLICKO-2</small>
                      <strong>{selectedMmrLabel}</strong>
                    </span>
                    <span>
                      <small>MODE DE TEST</small>
                      <strong>BOT LOCAL SI ACTIVÉ</strong>
                    </span>
                    <span>
                      <small>GROUPE</small>
                      <strong>SOLO</strong>
                    </span>
                  </div>
                  <section className="duel-setup">
                    <header>
                      <div>
                        <span className="eyebrow">CONDITIONS DE VICTOIRE</span>
                        <h2>PREMIER OBJECTIF GAGNANT</h2>
                      </div>
                      <b>HOWLING ABYSS</b>
                    </header>
                    <div className="duel-objectives">
                      <span>
                        <i>01</i>
                        <strong>PREMIER SANG</strong>
                        <small>Obtenir la première élimination.</small>
                      </span>
                      <span>
                        <i>02</i>
                        <strong>100 CS</strong>
                        <small>Atteindre cent sbires en premier.</small>
                      </span>
                      <span>
                        <i>03</i>
                        <strong>PREMIÈRE TOURELLE</strong>
                        <small>Détruire la première tourelle ennemie.</small>
                      </span>
                    </div>
                  </section>
                  <div
                    className={`watcher-queue-status status-${watcher.tone} ${backend.watcherOnline ? "is-online" : ""}`}
                  >
                    <i />
                    <span>
                      <small>WATCHER LOCAL</small>
                      <strong>{watcher.label}</strong>
                    </span>
                    <p>{watcher.description}</p>
                    <button
                      type="button"
                      onClick={() =>
                        go(backend.watcherOnline ? "duels" : "download")
                      }
                    >
                      {backend.watcherOnline
                        ? "OUVRIR LE WATCHER"
                        : "CONFIGURER LE WATCHER"}{" "}
                      →
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="play-actions">
              <Button
                disabled={
                  backend.busy ||
                  Boolean(
                    backend.party &&
                    (mode === "1V1" ||
                      !backend.party.allReady ||
                      !backend.party.viewerIsLeader),
                  )
                }
                onClick={() => void findMatch()}
              >
                {backend.busy
                  ? "CONNEXION…"
                  : backend.session
                    ? backend.party && mode === "1V1"
                      ? "1V1 EN SOLO UNIQUEMENT"
                      : backend.party && !backend.party.viewerIsLeader
                        ? "EN ATTENTE DU CHEF"
                        : backend.party && !backend.party.allReady
                          ? "GROUPE NON PRÊT"
                          : mode === "1V1" && !backend.watcherOnline
                            ? "CONFIGURER LE WATCHER"
                            : mode === "1V1" && !backend.profile?.riotId
                              ? "LIER TON RIOT ID"
                              : "TROUVER UN MATCH"
                    : "SE CONNECTER POUR JOUER"}
              </Button>
            </div>
          </Card>
          <Card className="play-side">
            <div className="play-party-section">
              <h2>
                GROUPE{" "}
                {backend.party
                  ? `${backend.party.members.length}/${backend.party.capacity}`
                  : ""}
              </h2>
              {liveParty}
              {!backend.session ? (
                <Button kind="outline" onClick={() => void backend.login()}>
                  SE CONNECTER
                </Button>
              ) : !backend.party ? (
                <Button
                  kind="outline"
                  onClick={() => void backend.createParty()}
                >
                  CRÉER UN GROUPE
                </Button>
              ) : (
                <>
                  {backend.party.viewerIsLeader ? (
                    <form
                      className="inline-form"
                      onSubmit={(event) => void submitInvite(event)}
                    >
                      <label className="sr-only" htmlFor="party-invite-name">
                        Pseudo du joueur à inviter
                      </label>
                      <input
                        id="party-invite-name"
                        value={inviteName}
                        onChange={(event) => setInviteName(event.target.value)}
                        placeholder="Pseudo Showdown"
                      />
                      <Button
                        type="submit"
                        disabled={!inviteName.trim() || backend.busy}
                      >
                        INVITER
                      </Button>
                    </form>
                  ) : (
                    <p className="party-leader-note">
                      Seul le chef du groupe peut inviter et lancer la
                      recherche.
                    </p>
                  )}
                  <div className="party-actions">
                    <Button
                      kind={me?.ready ? "danger" : "success"}
                      onClick={() => void togglePartyReady()}
                    >
                      {me?.ready ? "PAS PRÊT" : "PRÊT"}
                    </Button>
                    <Button
                      kind="outline"
                      onClick={() => void backend.leaveParty()}
                    >
                      QUITTER LE GROUPE
                    </Button>
                  </div>
                  {backend.party.invitations.length > 0 && (
                    <div className="party-pending">
                      <small>INVITATIONS EN ATTENTE</small>
                      {backend.party.invitations.map((invitation) => (
                        <span key={invitation.invitationId}>
                          <strong>{invitation.displayName}</strong>
                          <b>{invitation.status}</b>
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            {backend.invitations.length > 0 && (
              <div className="incoming-list">
                <h3>INVITATIONS</h3>
                {backend.invitations.map((invitation) => (
                  <article key={invitation.invitationId}>
                    <span>
                      <strong>{invitation.inviterDisplayName}</strong>
                      <small>{invitation.region}</small>
                    </span>
                    <Button
                      kind="success"
                      onClick={() =>
                        void backend.respondPartyInvitation(
                          invitation.invitationId,
                          true,
                        )
                      }
                    >
                      ACCEPTER
                    </Button>
                    <Button
                      kind="danger"
                      onClick={() =>
                        void backend.respondPartyInvitation(
                          invitation.invitationId,
                          false,
                        )
                      }
                    >
                      REFUSER
                    </Button>
                  </article>
                ))}
              </div>
            )}
            <div className="play-recent-form">
              <header>
                <small>FORME RÉCENTE</small>
                <b>
                  {recentResults.length
                    ? `${recentResults.filter((match) => match.outcome === "VICTORY").length} ${language === "en" ? "W" : "V"} — ${recentResults.filter((match) => match.outcome === "DEFEAT").length} ${language === "en" ? "L" : "D"}`
                    : "AUCUN MATCH"}
                </b>
              </header>
              <div>
                {recentResults.length
                  ? recentResults.map((match) => (
                      <span
                        className={match.outcome === "VICTORY" ? "win" : "loss"}
                        key={match.matchId}
                      >
                        {match.outcome === "VICTORY"
                          ? language === "en"
                            ? "W"
                            : "V"
                          : language === "en"
                            ? "L"
                            : "D"}
                      </span>
                    ))
                  : Array.from({ length: 5 }, (_, index) => (
                      <span key={index}>—</span>
                    ))}
              </div>
            </div>
            <div className="play-rank">
              <Image
                src={
                  mode === "1V1"
                    ? backend.duelStatistics?.provisional || !selectedGames
                      ? "/rank-icons/unranked.png"
                      : "/rank-icons/diamond.png"
                    : rankIcon(
                        backend.statistics?.rank,
                        backend.statistics?.games,
                      )
                }
                alt={`Classement ${selectedRank}`}
                width={78}
                height={78}
              />
              <span>
                <small>
                  {mode === "1V1" ? "1V1 GLICKO-2" : "5V5 TRUESKILL"}
                </small>
                <strong>{selectedRank}</strong>
                <b>
                  {mode === "1V1"
                    ? selectedMmrLabel
                    : fiveRank.detail}
                </b>
              </span>
            </div>
          </Card>
        </div>
      </div>
    </Localized>
  );
}
