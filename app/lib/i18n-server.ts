import { cookies, headers } from "next/headers";
import { LANGUAGE_COOKIE, resolveLanguage } from "./i18n-shared";

export async function getRequestLanguage() {
  const cookieStore = await cookies();
  const cookieLanguage = cookieStore.get(LANGUAGE_COOKIE)?.value;
  if (cookieLanguage === "fr" || cookieLanguage === "en") {
    return cookieLanguage;
  }

  const requestHeaders = await headers();
  return resolveLanguage(null, requestHeaders.get("accept-language"));
}
