import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BackendState } from "../app/lib/backend";
import { BackendContext } from "../app/lib/backend-context";
import { Shell } from "../app/components/shell";
import { LanguageProvider } from "../app/lib/i18n";
import { isKnownPath } from "../app/lib/navigation";

function backend(overrides: Partial<BackendState> = {}) {
  return {
    session: null,
    sessionStatus: "ANONYMOUS",
    profile: null,
    party: null,
    invitations: [],
    queue: null,
    match: null,
    lobby: null,
    history: [],
    historyPage: null,
    statistics: null,
    duelStatistics: null,
    fiveLeaderboard: [],
    duelLeaderboard: [],
    playerNames: {},
    watcherOnline: false,
    watcherJob: null,
    backendOnline: true,
    realtimeStatus: "IDLE",
    busy: false,
    error: null,
    notice: null,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    dismissError: vi.fn(),
    dismissNotice: vi.fn(),
    retry: vi.fn(),
    retryRealtime: vi.fn(),
    joinQueue: vi.fn(),
    leaveQueue: vi.fn(),
    answerReady: vi.fn(),
    updateProfile: vi.fn(),
    linkRiotId: vi.fn(),
    createParty: vi.fn(),
    invitePlayer: vi.fn(),
    setPartyReady: vi.fn(),
    removePartyMember: vi.fn(),
    leaveParty: vi.fn(),
    respondPartyInvitation: vi.fn(),
    refreshWatcher: vi.fn(),
    loadHistory: vi.fn(),
    loadMatchDetail: vi.fn(),
    ...overrides,
  } as unknown as BackendState;
}

describe("navigation accessible", () => {
  it("retire complètement la route des paramètres", () => {
    expect(isKnownPath("/settings")).toBe(false);
  });

  it("propose cinq cibles mobiles et place les pages secondaires dans Plus", () => {
    render(
      <LanguageProvider initialLanguage="fr">
        <BackendContext.Provider value={backend()}>
          <Shell page="home" setPage={vi.fn()}>
            <h1>Accueil</h1>
          </Shell>
        </BackendContext.Provider>
      </LanguageProvider>,
    );
    const navigation = screen.getByRole("navigation", {
      name: "Navigation mobile",
    });
    expect(within(navigation).getAllByRole("link")).toHaveLength(4);
    expect(within(navigation).getAllByRole("button")).toHaveLength(1);
    fireEvent.click(within(navigation).getByRole("button", { name: "PLUS" }));
    const more = screen.getByRole("navigation", {
      name: "Navigation supplémentaire",
    });
    expect(more).toBeInTheDocument();
    expect(within(more).getByRole("link", { name: "WATCHER" })).toHaveAttribute(
      "href",
      "/watcher",
    );
    expect(
      within(more).queryByRole("link", { name: "PARAMÈTRES" }),
    ).not.toBeInTheDocument();
  });

  it("gère le focus, Escape et le fond du menu mobile", async () => {
    render(
      <LanguageProvider initialLanguage="fr">
        <BackendContext.Provider value={backend()}>
          <Shell page="home" setPage={vi.fn()}>
            <h1>Accueil</h1>
          </Shell>
        </BackendContext.Provider>
      </LanguageProvider>,
    );
    const trigger = within(
      screen.getByRole("navigation", { name: "Navigation mobile" }),
    ).getByRole("button", { name: "PLUS" });
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Menu mobile" });
    await waitFor(() =>
      expect(
        within(dialog).getByRole("button", { name: "FERMER" }),
      ).toHaveFocus(),
    );
    expect(document.body).toHaveStyle({ overflow: "hidden" });
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(dialog).not.toBeVisible());
    await waitFor(() => expect(trigger).toHaveFocus());

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Fermer le menu" }));
    await waitFor(() => expect(dialog).not.toBeVisible());
  });

  it("expose une déconnexion mobile unique", async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    const setPage = vi.fn();
    render(
      <LanguageProvider initialLanguage="fr">
        <BackendContext.Provider
          value={backend({
            session: { playerId: "player-1", username: "Joueur" },
            sessionStatus: "AUTHENTICATED",
            logout,
          })}
        >
          <Shell page="profile" setPage={setPage}>
            <h1>Profil</h1>
          </Shell>
        </BackendContext.Provider>
      </LanguageProvider>,
    );
    const mobile = screen.getByRole("navigation", {
      name: "Navigation mobile",
    });
    fireEvent.click(within(mobile).getByRole("button", { name: "PLUS" }));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Menu mobile" })).getByRole(
        "button",
        { name: "DÉCONNEXION" },
      ),
    );
    await waitFor(() => expect(logout).toHaveBeenCalledOnce());
    expect(setPage).toHaveBeenCalledWith("home");
  });

  it("préserve les clics modifiés sur les liens", () => {
    const setPage = vi.fn();
    render(
      <LanguageProvider initialLanguage="fr">
        <BackendContext.Provider value={backend()}>
          <Shell page="home" setPage={setPage}>
            <h1>Accueil</h1>
          </Shell>
        </BackendContext.Provider>
      </LanguageProvider>,
    );
    const play = screen.getAllByRole("link", { name: "JOUER" })[0];
    window.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
    fireEvent.click(play, { ctrlKey: true });
    expect(setPage).not.toHaveBeenCalled();
  });

  it("rend les erreurs explicites et refermables", () => {
    const dismissError = vi.fn();
    render(
      <LanguageProvider initialLanguage="fr">
        <BackendContext.Provider
          value={backend({ error: "API indisponible", dismissError })}
        >
          <Shell page="home" setPage={vi.fn()}>
            <h1>Accueil</h1>
          </Shell>
        </BackendContext.Provider>
      </LanguageProvider>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("API indisponible");
    fireEvent.click(screen.getByRole("button", { name: "Fermer l’erreur" }));
    expect(dismissError).toHaveBeenCalledOnce();
  });

  it("annonce une reconnexion temps réel et permet de la relancer", () => {
    const retryRealtime = vi.fn();
    render(
      <LanguageProvider initialLanguage="fr">
        <BackendContext.Provider
          value={backend({
            session: { playerId: "player-1", username: "Joueur" },
            sessionStatus: "AUTHENTICATED",
            realtimeStatus: "RECONNECTING",
            retryRealtime,
          })}
        >
          <Shell page="home" setPage={vi.fn()}>
            <h1>Accueil</h1>
          </Shell>
        </BackendContext.Provider>
      </LanguageProvider>,
    );
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Reconnexion en cours");
    fireEvent.click(within(status).getByRole("button", { name: "RÉESSAYER" }));
    expect(retryRealtime).toHaveBeenCalledOnce();
  });

  it("rend la navigation dans la langue serveur et expose le changement progressif", () => {
    render(
      <LanguageProvider initialLanguage="en">
        <BackendContext.Provider value={backend()}>
          <Shell page="home" setPage={vi.fn()}>
            <h1>Accueil</h1>
          </Shell>
        </BackendContext.Provider>
      </LanguageProvider>,
    );
    expect(
      screen.getByRole("navigation", { name: "Main navigation" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "HOME" }).length,
    ).toBeGreaterThan(0);
    const english = screen.getAllByRole("button", { name: "English" })[0];
    expect(english).toHaveAttribute("name", "locale");
    expect(english).toHaveAttribute("value", "en");
    expect(english).toHaveAttribute("aria-pressed", "true");
    expect(english.closest("form")).toHaveAttribute("action", "/api/locale");
    expect(english.closest("form")).toHaveAttribute("method", "post");
  });

  it("change la langue sans recharger ni perdre la session", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      render(
        <LanguageProvider initialLanguage="fr">
          <BackendContext.Provider
            value={backend({
              session: { playerId: "player-1", username: "Joueur" },
              sessionStatus: "AUTHENTICATED",
            })}
          >
            <Shell page="home" setPage={vi.fn()}>
              <h1>Accueil</h1>
            </Shell>
          </BackendContext.Provider>
        </LanguageProvider>,
      );

      fireEvent.click(screen.getAllByRole("button", { name: "English" })[0]);

      await waitFor(() =>
        expect(
          screen.getAllByRole("link", { name: "HOME" }).length,
        ).toBeGreaterThan(0),
      );
      expect(
        screen.getAllByRole("button", { name: "SIGN OUT" }).length,
      ).toBeGreaterThan(0);
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/locale",
        expect.objectContaining({
          method: "POST",
          credentials: "same-origin",
        }),
      );
      expect(window.location.pathname).toBe("/");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
