"use client";

import Image from "next/image";
import type { KeyboardEvent } from "react";
import { Localized } from "../lib/i18n";

export type Role = "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT";
export type PlayMode = "1V1" | "5V5";

export const PLAY_MODES = [
  {
    id: "1V1",
    label: "1V1",
    subtitle: "HOWLING ABYSS · Glicko-2",
    title: "HOWLING ABYSS",
    icon: "/mode-icons/aram.png",
    activeIcon: "/mode-icons/aram-active.png",
  },
  {
    id: "5V5",
    label: "5V5",
    subtitle: "SUMMONER'S RIFT · TrueSkill",
    title: "SUMMONER'S RIFT",
    icon: "/mode-icons/summoners-rift.png",
    activeIcon: "/mode-icons/summoners-rift-active.png",
  },
] as const;

export function RolePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Role;
  onChange: (role: Role) => void;
}) {
  const roles: Role[] = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];
  const icons: Record<Role, string> = {
    TOP: "top",
    JUNGLE: "jungle",
    MID: "mid",
    ADC: "adc",
    SUPPORT: "support",
  };
  const moveRole = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const nextIndex =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? (index + 1) % roles.length
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? (index - 1 + roles.length) % roles.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? roles.length - 1
              : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    onChange(roles[nextIndex]);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      .item(nextIndex)
      .focus();
  };

  return (
    <Localized>
      <fieldset>
        <legend>{label}</legend>
        <div className="role-picker" role="radiogroup" aria-label={label}>
          {roles.map((role, index) => (
            <button
              type="button"
              role="radio"
              aria-checked={value === role}
              tabIndex={value === role ? 0 : -1}
              key={role}
              className={value === role ? "selected" : ""}
              onClick={() => onChange(role)}
              onKeyDown={(event) => moveRole(event, index)}
            >
              <Image
                src={`/role-icons/${icons[role]}.svg`}
                alt=""
                aria-hidden="true"
                width={28}
                height={28}
              />
              <span>{role}</span>
            </button>
          ))}
        </div>
      </fieldset>
    </Localized>
  );
}

export function ModePicker({
  mode,
  onChange,
}: {
  mode: PlayMode;
  onChange: (mode: PlayMode) => void;
}) {
  const moveMode = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const nextIndex =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? (index + 1) % PLAY_MODES.length
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? (index - 1 + PLAY_MODES.length) % PLAY_MODES.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? PLAY_MODES.length - 1
              : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    onChange(PLAY_MODES[nextIndex].id);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      .item(nextIndex)
      .focus();
  };

  return (
    <div
      className="central-mode-picker"
      role="radiogroup"
      aria-label="Mode de jeu"
    >
      {PLAY_MODES.map((item, index) => (
        <button
          type="button"
          role="radio"
          aria-checked={mode === item.id}
          tabIndex={mode === item.id ? 0 : -1}
          key={item.id}
          className={mode === item.id ? "selected" : ""}
          onClick={() => onChange(item.id)}
          onKeyDown={(event) => moveMode(event, index)}
        >
          <span className="mode-icon" aria-hidden="true">
            <Image
              className="mode-icon-idle"
              src={item.icon}
              alt=""
              width={42}
              height={42}
            />
            <Image
              className="mode-icon-active"
              src={item.activeIcon}
              alt=""
              width={42}
              height={42}
            />
          </span>
          <span>
            <strong>{item.label}</strong>
            <small>{item.subtitle}</small>
          </span>
        </button>
      ))}
    </div>
  );
}
