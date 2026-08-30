"use client";

import { useEffect, useState } from "react";
import { Shell } from "./components/shell";
import { BackendProvider, useBackend } from "./lib/backend";
import { activeFlowPage } from "./lib/flow";
import { useLanguage } from "./lib/i18n";
import {
  pageFromPath,
  pagePaths,
  pageTitles,
  type Page,
} from "./lib/navigation";
import { Download, Settings } from "./features/companion-pages";
import HistoryPage from "./features/history-page";
import { Home } from "./features/home-page";
import LeaderboardPage from "./features/leaderboard-page";
import LegalPage from "./features/legal-pages";
import { Lobby, Ready, Searching } from "./features/match-flow-pages";
import { Play } from "./features/play-page";
import ProfilePage from "./features/profile-page";
import WatcherPage from "./features/watcher-page";

export { Home } from "./features/home-page";
export { Play } from "./features/play-page";

export default function PinkwardApp({
  initialPage = "home",
}: {
  initialPage?: Page;
}) {
  return (
    <BackendProvider>
      <PinkwardExperience initialPage={initialPage} />
    </BackendProvider>
  );
}

function PinkwardExperience({ initialPage }: { initialPage: Page }) {
  const [page, setPage] = useState<Page>(initialPage);
  const backend = useBackend();
  const { t } = useLanguage();
  const activePage =
    backend.sessionStatus === "LOADING"
      ? page
      : activeFlowPage(page, {
          hasLobby: Boolean(backend.lobby),
          matchStatus: backend.match?.status ?? null,
          hasQueue: Boolean(backend.queue),
        });
  const navigate = (nextPage: Page) => {
    if (window.location.pathname !== pagePaths[nextPage])
      window.history.pushState(
        { pinkwardPage: nextPage },
        "",
        pagePaths[nextPage],
      );
    setPage(nextPage);
  };
  useEffect(() => {
    const syncFromBrowser = () =>
      setPage(pageFromPath(window.location.pathname));
    window.addEventListener("popstate", syncFromBrowser);
    return () => window.removeEventListener("popstate", syncFromBrowser);
  }, []);
  useEffect(() => {
    document.title = t(`${pageTitles[activePage]} · Pinkward`);
    if (
      activePage !== page &&
      window.location.pathname !== pagePaths[activePage]
    )
      window.history.replaceState(
        { pinkwardPage: activePage },
        "",
        pagePaths[activePage],
      );
  }, [activePage, page, t]);
  return (
    <Shell page={activePage} setPage={navigate}>
      {backend.sessionStatus === "LOADING" ? (
        <div className="page boot-page" role="status" aria-live="polite">
          <span className="eyebrow">PINKWARD</span>
          <h1 tabIndex={-1}>PRÉPARATION DE TA SESSION</h1>
          <p>Connexion sécurisée et synchronisation des données en cours…</p>
          <div className="boot-progress" aria-hidden="true">
            <i />
          </div>
        </div>
      ) : (
        <>
          {activePage === "home" && <Home go={navigate} />}
          {activePage === "play" && <Play go={navigate} />}
          {activePage === "duels" && <WatcherPage go={navigate} />}
          {activePage === "searching" && <Searching go={navigate} />}
          {activePage === "ready" && <Ready go={navigate} />}
          {activePage === "lobby" && <Lobby />}
          {activePage === "matches" && <HistoryPage />}
          {activePage === "leaderboard" && <LeaderboardPage />}
          {activePage === "download" && <Download />}
          {activePage === "profile" && <ProfilePage />}
          {activePage === "settings" && <Settings go={navigate} />}
          {activePage === "legal" && <LegalPage document="legal" />}
          {activePage === "privacy" && <LegalPage document="privacy" />}
          {activePage === "terms" && <LegalPage document="terms" />}
        </>
      )}
    </Shell>
  );
}
