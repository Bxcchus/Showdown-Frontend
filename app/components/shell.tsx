"use client";

import type { FormEvent, MouseEvent, ReactNode } from "react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useBackend } from "../lib/backend";
import { Localized, useLanguage } from "../lib/i18n";
import { pagePaths, visibleSection, type Page } from "../lib/navigation";

const desktopNavigation: Array<[Page, string]> = [
  ["home", "ACCUEIL"],
  ["play", "JOUER"],
  ["duels", "WATCHER"],
  ["matches", "HISTORIQUE"],
  ["leaderboard", "CLASSEMENT"],
  ["profile", "PROFIL"],
  ["download", "TÉLÉCHARGER"],
];

const mobilePrimary: Array<[Page, string]> = [
  ["home", "ACCUEIL"],
  ["play", "JOUER"],
  ["matches", "HISTORIQUE"],
  ["leaderboard", "CLASSEMENT"],
];

const mobileMore: Array<[Page, string]> = [
  ["duels", "WATCHER"],
  ["profile", "PROFIL"],
  ["download", "TÉLÉCHARGER"],
  ["settings", "PARAMÈTRES"],
];
const subscribeToHydration = () => () => undefined;

function LanguageFlag({ language }: { language: "fr" | "en" }) {
  if (language === "fr") {
    return (
      <svg
        className="language-flag"
        viewBox="0 0 60 40"
        role="img"
        aria-hidden="true"
        focusable="false"
      >
        <rect width="20" height="40" fill="#0055a4" />
        <rect x="20" width="20" height="40" fill="#fff" />
        <rect x="40" width="20" height="40" fill="#ef4135" />
      </svg>
    );
  }
  return (
    <svg
      className="language-flag"
      viewBox="0 0 60 40"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#fff" strokeWidth="9" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#c8102e" strokeWidth="4" />
      <path d="M30 0v40M0 20h60" stroke="#fff" strokeWidth="13" />
      <path d="M30 0v40M0 20h60" stroke="#c8102e" strokeWidth="7" />
    </svg>
  );
}

function NavLink({
  page,
  current,
  go,
  children,
}: {
  page: Page;
  current: Page;
  go: (page: Page) => void;
  children: ReactNode;
}) {
  const activate = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    go(page);
  };
  return (
    <a
      href={pagePaths[page]}
      className={current === page ? "active" : ""}
      aria-current={current === page ? "page" : undefined}
      onClick={activate}
    >
      {children}
    </a>
  );
}

function LanguageSwitch({ className }: { className: string }) {
  const { changeLanguage, language } = useLanguage();
  const [pendingLanguage, setPendingLanguage] = useState<"fr" | "en" | null>(
    null,
  );
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const nextLanguage = submitter?.value;
    if (
      (nextLanguage !== "fr" && nextLanguage !== "en") ||
      nextLanguage === language ||
      pendingLanguage
    )
      return;
    setPendingLanguage(nextLanguage);
    try {
      await changeLanguage(nextLanguage);
    } catch {
      /* Keep the current language and the active session if persistence fails. */
    } finally {
      setPendingLanguage(null);
    }
  };
  return (
    <form
      className={className}
      action="/api/locale"
      method="post"
      onSubmit={(event) => void submit(event)}
      role="group"
      aria-label={language === "fr" ? "Langue" : "Language"}
      aria-busy={Boolean(pendingLanguage)}
    >
      <button
        type="submit"
        name="locale"
        value="fr"
        className={language === "fr" ? "active" : ""}
        aria-pressed={language === "fr"}
        aria-label="Français"
        title="Français"
        disabled={Boolean(pendingLanguage)}
      >
        <LanguageFlag language="fr" />
      </button>
      <button
        type="submit"
        name="locale"
        value="en"
        className={language === "en" ? "active" : ""}
        aria-pressed={language === "en"}
        aria-label="English"
        title="English"
        disabled={Boolean(pendingLanguage)}
      >
        <LanguageFlag language="en" />
      </button>
    </form>
  );
}

export function Shell({
  page,
  setPage,
  children,
}: {
  page: Page;
  setPage: (page: Page) => void;
  children: ReactNode;
}) {
  const backend = useBackend();
  const { language } = useLanguage();
  const current = visibleSection(page);
  const [moreOpen, setMoreOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const moreTrigger = useRef<HTMLButtonElement>(null);
  const morePanel = useRef<HTMLDivElement>(null);
  const previousPage = useRef(page);
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const accountName = backend.session
    ? backend.profile?.onboardingComplete
      ? backend.profile.displayName
      : "CHOISIR UN PSEUDO"
    : "SE CONNECTER";
  const realtimeLabel =
    backend.realtimeStatus === "CONNECTED"
      ? "TEMPS RÉEL"
      : backend.realtimeStatus === "CONNECTING"
        ? "CONNEXION…"
        : backend.realtimeStatus === "RECONNECTING"
          ? "RECONNEXION…"
          : "MODE DÉGRADÉ";

  useEffect(() => {
    if (previousPage.current === page) return;
    previousPage.current = page;
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>("#main-content h1")
        ?.focus({ preventScroll: true });
    });
    const close = window.setTimeout(() => setMoreOpen(false), 0);
    return () => window.clearTimeout(close);
  }, [page]);

  useEffect(() => {
    if (!moreOpen) return;
    const previousOverflow = document.body.style.overflow;
    const main = document.getElementById("main-content");
    const topbar = document.querySelector<HTMLElement>(".topbar");
    const mobileNav = document.querySelector<HTMLElement>(".mobile-nav");
    document.body.style.overflow = "hidden";
    main?.setAttribute("inert", "");
    topbar?.setAttribute("inert", "");
    mobileNav?.setAttribute("inert", "");
    window.setTimeout(
      () =>
        morePanel.current
          ?.querySelector<HTMLElement>("a, button:not([disabled])")
          ?.focus(),
      0,
    );
    const close = () => {
      setMoreOpen(false);
      if (window.history.state?.gymsLolMobileMenu) window.history.back();
      window.setTimeout(() => moreTrigger.current?.focus(), 0);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        morePanel.current?.querySelectorAll<HTMLElement>(
          'a, button:not([disabled]), select, input, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => !element.hasAttribute("hidden"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const closeOnHistory = () => {
      setMoreOpen(false);
      window.setTimeout(() => moreTrigger.current?.focus(), 0);
    };
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("keydown", trapFocus);
    window.addEventListener("popstate", closeOnHistory);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("keydown", trapFocus);
      window.removeEventListener("popstate", closeOnHistory);
      document.body.style.overflow = previousOverflow;
      main?.removeAttribute("inert");
      topbar?.removeAttribute("inert");
      mobileNav?.removeAttribute("inert");
    };
  }, [moreOpen]);

  const navigate = (nextPage: Page) => {
    if (window.history.state?.gymsLolMobileMenu) {
      const { gymsLolMobileMenu: _menu, ...state } = window.history.state;
      void _menu;
      window.history.replaceState(state, "", window.location.href);
    }
    setMoreOpen(false);
    setPage(nextPage);
  };

  const toggleMore = () => {
    if (moreOpen) {
      setMoreOpen(false);
      if (window.history.state?.gymsLolMobileMenu) window.history.back();
      return;
    }
    window.history.pushState(
      { ...(window.history.state ?? {}), gymsLolMobileMenu: true },
      "",
      window.location.href,
    );
    setMoreOpen(true);
  };

  const closeMore = () => {
    setMoreOpen(false);
    if (window.history.state?.gymsLolMobileMenu) window.history.back();
    window.setTimeout(() => moreTrigger.current?.focus(), 0);
  };

  const logoutFromMobile = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    navigate("home");
    try {
      await backend.logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <Localized>
      <div
        className="app-shell"
        data-session-status={backend.sessionStatus.toLowerCase()}
        data-realtime-status={backend.realtimeStatus.toLowerCase()}
      >
        <a className="skip-link" href="#main-content">
          ALLER AU CONTENU
        </a>
        <header className="topbar">
          <NavLink page="home" current={current} go={navigate}>
            <span className="wordmark">GYMS.LOL</span>
          </NavLink>
          <nav aria-label="Navigation principale">
            {desktopNavigation.map(([id, label]) => (
              <NavLink key={id} page={id} current={current} go={navigate}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="account-links">
            <LanguageSwitch className="language-switch" />
            <button
              type="button"
              onClick={() =>
                backend.session ? navigate("profile") : void backend.login()
              }
            >
              {accountName.toUpperCase()}
            </button>
            <button
              type="button"
              className={
                backend.backendOnline === true &&
                (!backend.session || backend.realtimeStatus === "CONNECTED")
                  ? "online"
                  : backend.backendOnline === false
                    ? "offline"
                    : "pending"
              }
              onClick={() =>
                backend.session ? navigate("settings") : void backend.login()
              }
            >
              {backend.profile?.region ?? "EUW"} ·{" "}
              {backend.session && backend.backendOnline
                ? realtimeLabel
                : backend.backendOnline === null
                  ? "VÉRIFICATION…"
                  : backend.backendOnline
                    ? "API PRÊTE"
                    : "HORS LIGNE"}
            </button>
            {backend.session && (
              <button
                type="button"
                className="logout-link"
                onClick={() => void backend.logout()}
              >
                DÉCONNEXION
              </button>
            )}
          </div>
        </header>
        {backend.session && backend.realtimeStatus !== "CONNECTED" && (
          <div className="realtime-banner" role="status" aria-live="polite">
            <span>
              {backend.realtimeStatus === "CONNECTING"
                ? "Connexion au temps réel…"
                : backend.realtimeStatus === "RECONNECTING"
                  ? "Temps réel interrompu. Reconnexion en cours…"
                  : "Temps réel indisponible. Actualisation en mode dégradé."}
            </span>
            {backend.realtimeStatus !== "CONNECTING" && (
              <button type="button" onClick={backend.retryRealtime}>
                RÉESSAYER
              </button>
            )}
          </div>
        )}
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="site-footer">
          <div className="site-footer__inner">
            <div className="site-footer__brand">
              <strong>GYMS.LOL</strong>
              <small>
                {language === "fr"
                  ? "Matchmaking communautaire · Version de développement"
                  : "Community matchmaking · Development version"}
              </small>
              <small>© 2026 GYMS.LOL</small>
            </div>
            <nav
              aria-label={language === "fr" ? "Liens légaux" : "Legal links"}
            >
              <NavLink page="legal" current={current} go={navigate}>
                {language === "fr" ? "Mentions légales" : "Legal notice"}
              </NavLink>
              <NavLink page="privacy" current={current} go={navigate}>
                {language === "fr" ? "Confidentialité" : "Privacy"}
              </NavLink>
              <NavLink page="terms" current={current} go={navigate}>
                {language === "fr"
                  ? "Conditions d’utilisation"
                  : "Terms of use"}
              </NavLink>
            </nav>
            <p className="site-footer__disclaimer">
              {language === "fr"
                ? "GYMS.LOL est un projet communautaire indépendant, non affilié à Riot Games. League of Legends et Riot Games appartiennent à leurs titulaires respectifs."
                : "GYMS.LOL is an independent community project and is not affiliated with Riot Games. League of Legends and Riot Games belong to their respective owners."}
            </p>
          </div>
        </footer>
        <button
          type="button"
          className="mobile-more-backdrop"
          aria-label="Fermer le menu"
          hidden={!moreOpen}
          onClick={closeMore}
        />
        <div
          id="mobile-more-menu"
          className="mobile-more"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-more-title"
          hidden={!moreOpen}
          ref={morePanel}
        >
          <div className="mobile-more-heading">
            <h2 id="mobile-more-title">Menu mobile</h2>
            <button type="button" onClick={closeMore}>
              FERMER
            </button>
          </div>
          <nav aria-label="Navigation supplémentaire">
            {mobileMore.map(([id, label]) => (
              <NavLink key={id} page={id} current={current} go={navigate}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="mobile-more-session">
            <span>
              <small>{backend.session ? "COMPTE CONNECTÉ" : "SESSION"}</small>
              <strong>{accountName}</strong>
            </span>
            {backend.session ? (
              <button
                type="button"
                className="mobile-logout"
                disabled={loggingOut}
                onClick={() => void logoutFromMobile()}
              >
                {loggingOut ? "DÉCONNEXION…" : "DÉCONNEXION"}
              </button>
            ) : (
              <button type="button" onClick={() => void backend.login()}>
                SE CONNECTER
              </button>
            )}
          </div>
          <LanguageSwitch className="mobile-more-language" />
        </div>
        <nav className="mobile-nav" aria-label="Navigation mobile">
          {mobilePrimary.map(([id, label]) => (
            <NavLink key={id} page={id} current={current} go={navigate}>
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            className={
              moreOpen || mobileMore.some(([id]) => id === current)
                ? "active"
                : ""
            }
            aria-expanded={moreOpen}
            aria-controls="mobile-more-menu"
            disabled={!mounted}
            ref={moreTrigger}
            onClick={toggleMore}
          >
            PLUS
          </button>
        </nav>
        {backend.error && (
          <div className="backend-toast" role="alert" aria-live="assertive">
            <span>{backend.error}</span>
            <button type="button" onClick={() => void backend.retry()}>
              RÉESSAYER
            </button>
            <button
              type="button"
              aria-label="Fermer l’erreur"
              onClick={backend.dismissError}
            >
              ×
            </button>
          </div>
        )}
        {backend.notice && (
          <div className="backend-toast backend-toast--success" role="status">
            <span>{backend.notice}</span>
            <button
              type="button"
              aria-label="Fermer la confirmation"
              onClick={backend.dismissNotice}
            >
              ×
            </button>
          </div>
        )}
      </div>
    </Localized>
  );
}
