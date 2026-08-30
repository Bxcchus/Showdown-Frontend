export type Page =
  | "home"
  | "play"
  | "duels"
  | "searching"
  | "ready"
  | "lobby"
  | "matches"
  | "leaderboard"
  | "download"
  | "profile"
  | "settings"
  | "legal"
  | "privacy"
  | "terms";

export const pagePaths: Record<Page, string> = {
  home: "/",
  play: "/play",
  duels: "/watcher",
  searching: "/searching",
  ready: "/ready-check",
  lobby: "/lobby",
  matches: "/history",
  leaderboard: "/leaderboard",
  download: "/download",
  profile: "/profile",
  settings: "/settings",
  legal: "/legal",
  privacy: "/privacy",
  terms: "/terms",
};

export const pageTitles: Record<Page, string> = {
  home: "Accueil",
  play: "Jouer",
  duels: "Watcher",
  searching: "Recherche",
  ready: "Confirmation",
  lobby: "Lobby du match",
  matches: "Historique",
  leaderboard: "Classement",
  download: "Téléchargement",
  profile: "Profil",
  settings: "Paramètres",
  legal: "Mentions légales",
  privacy: "Confidentialité",
  terms: "Conditions d’utilisation",
};

export function pageFromPath(pathname: string): Page {
  const normalized =
    pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return (
    (Object.entries(pagePaths).find(([, path]) => path === normalized)?.[0] as
      Page | undefined) ?? "home"
  );
}

export function isKnownPath(pathname: string) {
  const normalized =
    pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return Object.values(pagePaths).includes(normalized);
}

export function visibleSection(page: Page): Page {
  return page === "searching" || page === "ready" || page === "lobby"
    ? "play"
    : page;
}
