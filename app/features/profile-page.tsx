"use client";

import Image from "next/image";
import { type FormEvent, useState } from "react";
import { Button, Card, EmptyState, PageTitle } from "../components/ui";
import { useBackend } from "../lib/backend";
import { Localized, useLanguage } from "../lib/i18n";
import {
  duelRankPresentation,
  fiveRankPresentation,
  roleLabel,
} from "../lib/presentation";

function ProfileEditor() {
  const backend = useBackend();
  const profile = backend.profile!;
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [region, setRegion] = useState(profile.region);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    await backend.updateProfile({
      displayName,
      region,
      primaryRole: profile.primaryRole,
      secondaryRole: profile.secondaryRole,
    });
  };
  return (
    <Card className="profile-editor">
      <h2>COMPTE</h2>
      <form className="stack-form" onSubmit={(event) => void save(event)}>
        <label>
          PSEUDO
          <input
            autoComplete="nickname"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>
        <label>
          RÉGION
          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          >
            <option>EUW</option>
            <option>EUNE</option>
            <option>NA</option>
          </select>
        </label>
        <Button type="submit" disabled={!displayName.trim() || backend.busy}>
          {backend.busy ? "ENREGISTREMENT…" : "ENREGISTRER LE PROFIL"}
        </Button>
      </form>
      <div className="identity-line">
        <span>
          <small>RIOT ID</small>
          <strong>{profile.riotId ?? "NON LIÉ"}</strong>
        </span>
        <Button kind="outline" onClick={() => void backend.linkRiotId()}>
          LIER DEPUIS LE WATCHER
        </Button>
      </div>
    </Card>
  );
}

export default function ProfilePage() {
  const backend = useBackend();
  const { formatDate, language } = useLanguage();
  const fiveRank = fiveRankPresentation(backend.statistics);
  const duelRank = duelRankPresentation(backend.duelStatistics);
  return (
    <Localized>
      <div className="page profile-page">
        <PageTitle
          eyebrow="PROFIL JOUEUR"
          title="PROFIL"
          text="Ton identité Showdown et tes classements de la saison en cours."
        />
        {!backend.session || !backend.profile ? (
          <Card className="auth-empty-card">
            <EmptyState
              title="Connecte-toi pour afficher ton profil"
              text="Ton pseudo, ton Riot ID et tes classements resteront associés à ton compte."
              action={
                <Button onClick={() => void backend.login()}>
                  SE CONNECTER
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="profile-layout">
            <aside className="profile-sidebar">
              <div className="profile-identity">
                <div className="profile-avatar">
                  <Image
                    className="profile-avatar-image"
                    src={
                      backend.profile.riotProfileIconId
                        ? `https://ddragon.leagueoflegends.com/cdn/16.16.1/img/profileicon/${backend.profile.riotProfileIconId}.png`
                        : "/champion-icons/akali.png"
                    }
                    unoptimized={Boolean(
                      backend.profile.riotProfileIconId,
                    )}
                    alt="Icône du profil Riot"
                    width={112}
                    height={112}
                  />
                </div>
                <h2>{backend.profile.displayName.toUpperCase()}</h2>
                <b>#{backend.profile.region}</b>
                {backend.profile.riotSummonerLevel && (
                  <small>NIVEAU {backend.profile.riotSummonerLevel}</small>
                )}
                <small className={backend.profile.online ? "positive" : ""}>
                  {backend.profile.online ? "EN LIGNE" : "HORS LIGNE"}
                </small>
              </div>
            </aside>
            <div className="profile-main">
              <Card className="profile-ranks">
                <div className="rank-overview">
                  <span className="rank-emblem">
                    <Image
                      src={fiveRank.icon}
                      alt="Classement 5v5"
                      width={132}
                      height={132}
                    />
                  </span>
                  <div>
                    <small>5V5 TRUESKILL</small>
                    <strong>{fiveRank.label}</strong>
                    <b>
                      {backend.statistics?.games
                        ? `${backend.statistics.mmr} MMR`
                        : fiveRank.detail}
                    </b>
                  </div>
                </div>
                <div className="rank-overview">
                  <span className="rank-emblem">
                    <Image
                      src={duelRank.icon}
                      alt="Classement 1v1"
                      width={132}
                      height={132}
                    />
                  </span>
                  <div>
                    <small>1V1 GLICKO-2</small>
                    <strong>{duelRank.label}</strong>
                    <b>{duelRank.detail}</b>
                  </div>
                </div>
                <div className="rank-number">
                  <small>TAUX DE VICTOIRE</small>
                  <strong>
                    {Math.round(backend.statistics?.winRate ?? 0)}%
                  </strong>
                  <b>
                    {backend.statistics?.wins ?? 0}{" "}
                    {language === "en" ? "W" : "V"} —{" "}
                    {backend.statistics?.losses ?? 0}{" "}
                    {language === "en" ? "L" : "D"}
                  </b>
                </div>
                <div className="rank-number">
                  <small>MEILLEUR MMR</small>
                  <strong>
                    {backend.statistics?.games
                      ? backend.statistics.peakMmr
                      : "—"}
                  </strong>
                  <b>{backend.statistics?.season ?? "SAISON EN COURS"}</b>
                </div>
              </Card>
              <div className="profile-content">
                <div className="profile-center">
                  <ProfileEditor
                    key={`${backend.profile.playerId}-${backend.profile.displayName}-${backend.profile.region}`}
                  />
                </div>
                <Card className="recent-summary">
                  <h2>RÉSUMÉ RÉCENT</h2>
                  {backend.recentHistory.slice(0, 5).map((match) => (
                    <article key={match.matchId}>
                      <span>
                        <strong>
                          {roleLabel(match.role)} ·{" "}
                          {match.mode === "ONE_V_ONE" ? "1V1" : "5V5"}
                        </strong>
                        <b
                          className={
                            match.outcome === "VICTORY"
                              ? "positive"
                              : "negative"
                          }
                        >
                          {match.outcome === "VICTORY" ? "VICTOIRE" : "DÉFAITE"}
                        </b>
                        <small>
                          {formatDate(match.playedAt)} ·{" "}
                          {match.mmrDelta >= 0 ? "+" : ""}
                          {match.mmrDelta} MMR
                        </small>
                      </span>
                    </article>
                  ))}
                  {!backend.recentHistory.length && (
                    <EmptyState
                      title="Aucun match récent"
                      text="Tes cinq derniers résultats apparaîtront ici."
                    />
                  )}
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </Localized>
  );
}
