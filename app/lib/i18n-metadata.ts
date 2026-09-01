import type { Metadata } from "next";
import { pagePaths, type Page } from "./navigation";
import type { Language } from "./i18n-shared";

const SITE_URL = "https://gyms.lol";
const SOCIAL_IMAGE = `${SITE_URL}/og.png`;

const siteCopy: Record<
  Language,
  { title: string; description: string; socialDescription: string }
> = {
  fr: {
    title: "GYMS.LOL — Matchmaking communautaire",
    description:
      "La plateforme compétitive pour former ton groupe, rejoindre une file et jouer.",
    socialDescription:
      "Forme ton groupe, choisis tes rôles et trouve ton prochain match.",
  },
  en: {
    title: "GYMS.LOL — Community Matchmaking",
    description:
      "The competitive platform for forming your party, joining a queue and playing.",
    socialDescription:
      "Form your party, choose your roles and find your next match.",
  },
};

const pageNames: Record<Language, Record<Page | "not-found", string>> = {
  fr: {
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
    legal: "Mentions légales",
    privacy: "Confidentialité",
    terms: "Conditions d’utilisation",
    "not-found": "Page introuvable",
  },
  en: {
    home: "Home",
    play: "Play",
    duels: "Watcher",
    searching: "Searching",
    ready: "Ready check",
    lobby: "Match lobby",
    matches: "Match history",
    leaderboard: "Leaderboard",
    download: "Download",
    profile: "Profile",
    legal: "Legal notice",
    privacy: "Privacy",
    terms: "Terms of use",
    "not-found": "Page not found",
  },
};

function socialMetadata(
  language: Language,
  title: string,
  path = "/",
): Pick<Metadata, "openGraph" | "twitter"> {
  const copy = siteCopy[language];
  return {
    openGraph: {
      title,
      description: copy.socialDescription,
      images: [
        {
          url: SOCIAL_IMAGE,
          width: 1200,
          height: 630,
          alt: copy.title,
        },
      ],
      locale: language === "en" ? "en_GB" : "fr_FR",
      type: "website",
      url: `${SITE_URL}${path}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: copy.socialDescription,
      images: [SOCIAL_IMAGE],
    },
  };
}

export function siteMetadata(language: Language): Metadata {
  const copy = siteCopy[language];
  return {
    metadataBase: new URL(SITE_URL),
    title: copy.title,
    description: copy.description,
    icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    },
    alternates: { canonical: SITE_URL },
    ...socialMetadata(language, copy.title),
  };
}

export function pageMetadata(
  language: Language,
  page: Page | "not-found",
): Metadata {
  const copy = siteCopy[language];
  const title = `${pageNames[language][page]} · GYMS.LOL`;
  const path = page === "not-found" ? null : pagePaths[page];
  return {
    title,
    description: copy.description,
    alternates: path ? { canonical: `${SITE_URL}${path}` } : undefined,
    ...socialMetadata(language, title, path ?? "/"),
  };
}
