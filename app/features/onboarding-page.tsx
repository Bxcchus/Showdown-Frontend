"use client";

import { useState, type FormEvent } from "react";
import { Button, Card } from "../components/ui";
import { useBackend } from "../lib/backend";
import { Localized } from "../lib/i18n";

const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N}_. -]+$/u;

export default function OnboardingPage() {
  const backend = useBackend();
  const profile = backend.profile;
  const [displayName, setDisplayName] = useState("");
  const [region, setRegion] = useState(profile?.region ?? "EUW");
  const normalizedName = displayName.trim().replace(/\s+/g, " ");
  const validName =
    normalizedName.length >= 3 &&
    normalizedName.length <= 24 &&
    DISPLAY_NAME_PATTERN.test(normalizedName);

  if (!profile) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validName || backend.busy) return;
    await backend.updateProfile({
      displayName: normalizedName,
      region,
      primaryRole: profile.primaryRole,
      secondaryRole: profile.secondaryRole,
    });
  };

  return (
    <Localized>
      <div className="page onboarding-page">
        <Card className="onboarding-card">
          <span className="eyebrow">BIENVENUE SUR GYMS.LOL</span>
          <h1 tabIndex={-1}>CHOISIS TON PSEUDO</h1>
          <p className="onboarding-intro">
            Ce nom sera visible par les autres joueurs dans les groupes, les
            matchs et le classement.
          </p>

          <div className="onboarding-privacy" role="note">
            <span aria-hidden="true">◇</span>
            <p>
              Ton adresse e-mail reste privée et ne sera jamais utilisée comme
              pseudo public.
            </p>
          </div>

          <form className="stack-form onboarding-form" onSubmit={submit}>
            <label htmlFor="onboarding-display-name">
              PSEUDO PUBLIC
              <input
                id="onboarding-display-name"
                name="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                minLength={3}
                maxLength={24}
                autoComplete="nickname"
                autoFocus
                required
                aria-describedby="onboarding-name-help"
                aria-invalid={displayName.length > 0 && !validName}
                placeholder="Ex. JungleDiff"
              />
            </label>
            <div className="onboarding-name-meta" id="onboarding-name-help">
              <span>3 à 24 caractères · lettres, chiffres, espaces, _ . -</span>
              <span>{displayName.length}/24</span>
            </div>

            <label htmlFor="onboarding-region">
              RÉGION
              <select
                id="onboarding-region"
                name="region"
                value={region}
                onChange={(event) => setRegion(event.target.value)}
              >
                <option value="EUW">EUW</option>
                <option value="EUNE">EUNE</option>
                <option value="NA">NA</option>
              </select>
            </label>

            <Button type="submit" disabled={!validName || backend.busy}>
              {backend.busy ? "ENREGISTREMENT…" : "CONTINUER"}
            </Button>
          </form>
        </Card>
      </div>
    </Localized>
  );
}
