import type { Metadata } from "next";
import PinkwardApp from "./pinkward-app";
import { pageMetadata } from "./lib/i18n-metadata";
import { getRequestLanguage } from "./lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getRequestLanguage(), "home");
}

export default function Home() {
  return <PinkwardApp initialPage="home" />;
}
