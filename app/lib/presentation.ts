import type {
  ApiMode,
  ApiRole,
  DuelStatistics,
  MatchStatistics,
  WatcherJob,
} from "./backend";

export type StatusTone = "success" | "warning" | "danger" | "neutral";

export type StatusPresentation = {
  label: string;
  description: string;
  tone: StatusTone;
};

export function watcherPresentation(
  online: boolean,
  job: WatcherJob | null,
): StatusPresentation {
  if (!online)
    return {
      label: "Hors ligne",
      description: "Lance le Watcher pour connecter le client League.",
      tone: "neutral",
    };
  const state = job?.state?.toUpperCase() ?? "IDLE";
  if (state === "ERROR" || state === "FAILED") {
    return {
      label: "Action requise",
      description: job?.detail ?? "Le dernier contrôle du Watcher a échoué.",
      tone: "danger",
    };
  }
  if (job?.outcome) {
    return {
      label: "Résultat détecté",
      description: `${job.objective?.replaceAll("_", " ") ?? "Objectif"} · ${job.outcome === "VICTORY" ? "victoire" : "défaite"}`,
      tone: "success",
    };
  }
  if (
    state.includes("GAME") ||
    state.includes("WATCH") ||
    state.includes("PROGRESS")
  ) {
    return {
      label: "Duel surveillé",
      description:
        job?.detail ?? "Les objectifs du duel sont surveillés en temps réel.",
      tone: "success",
    };
  }
  if (state.includes("LOBBY") || state.includes("CHAMP")) {
    return {
      label: "Lobby League prêt",
      description: job?.detail ?? "Le Watcher prépare la partie League.",
      tone: "warning",
    };
  }
  return {
    label: "Prêt",
    description: "Le Watcher attend un duel à vérifier.",
    tone: "success",
  };
}

export function fiveRankPresentation(statistics: MatchStatistics | null) {
  if (!statistics || statistics.games === 0)
    return {
      label: "NON CLASSÉ",
      detail: "0 partie",
      icon: "/rank-icons/unranked.png",
    };
  if (
    statistics.placementGamesRemaining > 0 ||
    statistics.rank.toUpperCase().includes("PLACEMENT")
  ) {
    return {
      label: "PLACEMENTS",
      detail: `${statistics.placementGamesRemaining} restante(s)`,
      icon: "/rank-icons/unranked.png",
    };
  }
  return {
    label: statistics.rank,
    detail: `${statistics.progression} LP`,
    icon: rankIcon(statistics.rank, statistics.games),
  };
}

export function duelRankPresentation(statistics: DuelStatistics | null) {
  if (!statistics || statistics.games === 0)
    return {
      label: "NON CLASSÉ",
      detail: "0 partie",
      icon: "/rank-icons/unranked.png",
    };
  if (statistics.provisional || statistics.placementGamesRemaining > 0) {
    return {
      label: "PLACEMENTS",
      detail: `${statistics.placementGamesRemaining} restante(s)`,
      icon: "/rank-icons/unranked.png",
    };
  }
  return {
    label: "CLASSÉ",
    detail: `${statistics.mmr} MMR`,
    icon: "/rank-icons/diamond.png",
  };
}

export function rankIcon(rank?: string | null, games = 0) {
  const normalized = rank?.toUpperCase() ?? "";
  if (
    games === 0 ||
    !normalized ||
    normalized.includes("UNRANKED") ||
    normalized.includes("PLACEMENT")
  )
    return "/rank-icons/unranked.png";
  if (
    normalized.includes("DIAMOND") ||
    normalized.includes("DIAMANT") ||
    normalized.includes("MASTER") ||
    normalized.includes("MAÎTRE")
  )
    return "/rank-icons/diamond.png";
  return "/rank-icons/emerald.png";
}

export function roleLabel(role?: ApiRole | "ADC" | null) {
  return role === "BOT" ? "ADC" : (role ?? "—");
}

export function modeLabel(mode?: ApiMode | null) {
  return mode === "ONE_V_ONE" ? "1V1 · Glicko-2" : "5V5 · TrueSkill";
}

const championDataDragonIds: Record<string, string> = {
  "Aurelion Sol": "AurelionSol",
  "Bel'Veth": "Belveth",
  "Cho'Gath": "Chogath",
  "Dr. Mundo": "DrMundo",
  "Jarvan IV": "JarvanIV",
  "Kai'Sa": "Kaisa",
  "Kha'Zix": "Khazix",
  "Kog'Maw": "KogMaw",
  "K'Sante": "KSante",
  LeBlanc: "Leblanc",
  "Lee Sin": "LeeSin",
  "Master Yi": "MasterYi",
  "Miss Fortune": "MissFortune",
  "Nunu & Willump": "Nunu",
  "Rek'Sai": "RekSai",
  "Renata Glasc": "Renata",
  "Tahm Kench": "TahmKench",
  "Twisted Fate": "TwistedFate",
  "Vel'Koz": "Velkoz",
  Wukong: "MonkeyKing",
  "Xin Zhao": "XinZhao",
};

export function championIconUrl(championName?: string | null) {
  const normalized = championName?.trim();
  if (!normalized) return null;
  const dataDragonId =
    championDataDragonIds[normalized] ?? normalized.replace(/[^a-z0-9]/gi, "");
  return `https://ddragon.leagueoflegends.com/cdn/16.16.1/img/champion/${encodeURIComponent(dataDragonId)}.png`;
}
