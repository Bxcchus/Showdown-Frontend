export const supportedLanguages = ["fr", "en"] as const;

export type Language = (typeof supportedLanguages)[number];

export const DEFAULT_LANGUAGE: Language = "fr";
export const LANGUAGE_COOKIE = "pinkward.language";
export const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const intlLocales: Record<Language, string> = {
  fr: "fr-FR",
  en: "en-GB",
};

export function isLanguage(value: unknown): value is Language {
  return (
    typeof value === "string" && supportedLanguages.includes(value as Language)
  );
}

export function intlLocale(language: Language) {
  return intlLocales[language];
}

export function languageFromAcceptLanguage(value: string | null): Language {
  if (!value) return DEFAULT_LANGUAGE;

  const preferences = value
    .split(",")
    .map((entry, index) => {
      const [tag = "", ...parameters] = entry.trim().split(";");
      const qualityParameter = parameters.find((parameter) =>
        parameter.trim().startsWith("q="),
      );
      const parsedQuality = qualityParameter
        ? Number.parseFloat(qualityParameter.trim().slice(2))
        : 1;
      return {
        language: tag.toLowerCase().split("-")[0],
        quality:
          Number.isFinite(parsedQuality) &&
          parsedQuality >= 0 &&
          parsedQuality <= 1
            ? parsedQuality
            : 0,
        index,
      };
    })
    .filter((preference) => preference.quality > 0)
    .sort(
      (left, right) => right.quality - left.quality || left.index - right.index,
    );

  for (const preference of preferences) {
    if (isLanguage(preference.language)) return preference.language;
  }
  return DEFAULT_LANGUAGE;
}

export function resolveLanguage(
  cookieValue: string | null | undefined,
  acceptLanguage: string | null = null,
): Language {
  return isLanguage(cookieValue)
    ? cookieValue
    : languageFromAcceptLanguage(acceptLanguage);
}

export function languageCookieHeader(language: Language, secure: boolean) {
  return [
    `${LANGUAGE_COOKIE}=${language}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${LANGUAGE_COOKIE_MAX_AGE}`,
    secure ? "Secure" : null,
  ]
    .filter(Boolean)
    .join("; ");
}
