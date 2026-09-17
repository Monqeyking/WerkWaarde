import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "WerkWaarde | Wat houd je écht over van je werk?",
  description: "Vergelijk salaris, pensioen, mobiliteit, reistijd en de totale waarde van een baan.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  return <html lang="nl"><body>{children}{publisherId && <Script strategy="beforeInteractive" async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`} crossOrigin="anonymous" />}</body></html>;
}
