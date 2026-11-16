import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "../lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} | ${SITE_TAGLINE}`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: SITE_NAME,
    title: `${SITE_NAME}: ${SITE_TAGLINE.toLowerCase()}`,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  return <html lang="nl"><head>{publisherId && <><meta name="google-adsense-account" content={publisherId} /><script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`} crossOrigin="anonymous" /></>}</head><body>{children}</body></html>;
}
