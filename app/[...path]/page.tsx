import type { Metadata } from "next";
import GymsLolApp from "../gyms-lol-app";
import { notFound } from "next/navigation";
import { isKnownPath, pageFromPath } from "../lib/navigation";
import { pageMetadata } from "../lib/i18n-metadata";
import { getRequestLanguage } from "../lib/i18n-server";

type CatchAllProps = {
  params: Promise<{ path: string[] }>;
};

function pathnameFromSegments(path: string[]) {
  return `/${path.join("/")}`;
}

export async function generateMetadata({
  params,
}: CatchAllProps): Promise<Metadata> {
  const { path } = await params;
  const pathname = pathnameFromSegments(path);
  const language = await getRequestLanguage();
  return pageMetadata(
    language,
    isKnownPath(pathname) ? pageFromPath(pathname) : "not-found",
  );
}

export default async function GymsLolCatchAllPage({ params }: CatchAllProps) {
  const { path } = await params;
  const pathname = pathnameFromSegments(path);
  if (!isKnownPath(pathname)) notFound();
  return <GymsLolApp initialPage={pageFromPath(pathname)} />;
}
