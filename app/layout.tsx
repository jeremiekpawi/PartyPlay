import type { Metadata, Viewport } from 'next';
import {
  Bricolage_Grotesque,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
} from 'next/font/google';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-bricolage',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'PartyPlay — Mini-jeux multijoueurs en temps réel',
  description:
    'Plateforme de mini-jeux multijoueurs en temps réel avec lobby 3D et PWA installable.',
  applicationName: 'PartyPlay',
  openGraph: {
    title: 'PartyPlay — Mini-jeux multijoueurs en temps réel',
    description:
      'Plateforme de mini-jeux multijoueurs en temps réel avec lobby 3D et PWA installable.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PartyPlay',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${bricolage.variable} ${jakarta.variable} ${jetbrains.variable}`}
    >
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
