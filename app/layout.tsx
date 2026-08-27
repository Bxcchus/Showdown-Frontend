import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://pinkward-showdown.guy-alexis60.chatgpt.site'),
  title: 'Pinkward — Matchmaking communautaire',
  description: 'La plateforme compétitive pour trouver votre groupe, rejoindre une file et jouer.',
  openGraph: {
    title: 'Pinkward — Matchmaking communautaire',
    description: 'Formez votre groupe, choisissez vos rôles et trouvez votre prochain match.',
    images: [{ url: 'https://pinkward-showdown.guy-alexis60.chatgpt.site/og.png', width: 1200, height: 630, alt: 'Pinkward — Matchmaking communautaire' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pinkward — Matchmaking communautaire',
    description: 'Formez votre groupe, choisissez vos rôles et trouvez votre prochain match.',
    images: ['https://pinkward-showdown.guy-alexis60.chatgpt.site/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
