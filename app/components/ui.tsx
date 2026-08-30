import type { ReactNode } from "react";
import { Localized } from "../lib/i18n";

export function Button({
  children,
  onClick,
  kind = "primary",
  disabled = false,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: "primary" | "outline" | "danger" | "success";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={`button button--${kind}`}
      onClick={onClick}
      disabled={disabled}
    >
      <Localized>{children}</Localized>
    </button>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`card ${className}`}>
      <Localized>{children}</Localized>
    </div>
  );
}

export function PageTitle({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <Localized>
      <header className="page-title">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1 tabIndex={-1}>{title}</h1>
          {text && <p>{text}</p>}
        </div>
        {action}
      </header>
    </Localized>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <Localized>
      <div className="empty-state">
        <span aria-hidden="true">◇</span>
        <h2>{title}</h2>
        <p>{text}</p>
        {action}
      </div>
    </Localized>
  );
}
