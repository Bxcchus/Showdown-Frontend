import type { Metadata } from "next";
import { LanguageProvider } from "./lib/i18n";
import { siteMetadata } from "./lib/i18n-metadata";
import { getRequestLanguage } from "./lib/i18n-server";
import "./globals.css";
import "./design-system.css";
import "./responsive.css";
import "./feature-pages.css";
import "./ergonomics.css";
import "./legal.css";

export async function generateMetadata(): Promise<Metadata> {
  return siteMetadata(await getRequestLanguage());
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const language = await getRequestLanguage();
  return (
    <html lang={language}>
      <body>
        <LanguageProvider initialLanguage={language}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
