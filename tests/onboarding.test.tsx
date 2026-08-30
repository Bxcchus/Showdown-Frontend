import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GymsLolExperience } from "../app/experience";
import OnboardingPage from "../app/features/onboarding-page";
import { BackendContext } from "../app/lib/backend-context";
import type { BackendState } from "../app/lib/backend-types";
import { LanguageProvider } from "../app/lib/i18n";

const profile = {
  playerId: "11111111-1111-4111-8111-111111111111",
  displayName: "Player-1111111111111111",
  region: "EUW",
  primaryRole: "MID" as const,
  secondaryRole: "JUNGLE" as const,
  onboardingComplete: false,
  riotId: null,
  riotProfileIconId: null,
  riotSummonerLevel: null,
  online: true,
};

function renderOnboarding(
  updateProfile = vi.fn().mockResolvedValue(true),
  language: "fr" | "en" = "fr",
) {
  const state = {
    profile,
    busy: false,
    updateProfile,
  } as unknown as BackendState;
  render(
    <LanguageProvider initialLanguage={language}>
      <BackendContext.Provider value={state}>
        <OnboardingPage />
      </BackendContext.Provider>
    </LanguageProvider>,
  );
  return updateProfile;
}

describe("onboarding du pseudo", () => {
  it("remplace toutes les pages par le choix du pseudo après le premier login", () => {
    const state = {
      session: { playerId: profile.playerId, username: "alexis@example.com" },
      sessionStatus: "AUTHENTICATED",
      profile,
      queue: null,
      match: null,
      lobby: null,
      backendOnline: true,
      realtimeStatus: "CONNECTED",
      busy: false,
      error: null,
      notice: null,
      updateProfile: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      retryRealtime: vi.fn(),
      dismissError: vi.fn(),
      dismissNotice: vi.fn(),
      retry: vi.fn(),
    } as unknown as BackendState;

    render(
      <LanguageProvider initialLanguage="fr">
        <BackendContext.Provider value={state}>
          <GymsLolExperience initialPage="home" />
        </BackendContext.Provider>
      </LanguageProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "CHOISIS TON PSEUDO" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("SHOWDOWN CLASSÉ")).not.toBeInTheDocument();
    expect(screen.queryByText("alexis@example.com")).not.toBeInTheDocument();
  });

  it("ne préremplit jamais le pseudo temporaire et enregistre le choix", async () => {
    const updateProfile = renderOnboarding();
    const input = screen.getByLabelText("PSEUDO PUBLIC");

    expect(input).toHaveValue("");
    expect(screen.getByRole("button", { name: "CONTINUER" })).toBeDisabled();

    fireEvent.change(input, { target: { value: "  Jungle   Diff  " } });
    fireEvent.click(screen.getByRole("button", { name: "CONTINUER" }));

    await waitFor(() =>
      expect(updateProfile).toHaveBeenCalledWith({
        displayName: "Jungle Diff",
        region: "EUW",
        primaryRole: "MID",
        secondaryRole: "JUNGLE",
      }),
    );
  });

  it("explique en anglais que l’adresse e-mail reste privée", () => {
    renderOnboarding(undefined, "en");

    expect(
      screen.getByRole("heading", { name: "CHOOSE YOUR NICKNAME" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/email address stays private/i),
    ).toBeInTheDocument();
  });
});
