import type { Metadata } from "next";
import GymsLolApp from "./gyms-lol-app";
import { pageMetadata } from "./lib/i18n-metadata";
import { getRequestLanguage } from "./lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getRequestLanguage(), "home");
}

export default function Home() {
  return <GymsLolApp initialPage="home" />;
}
