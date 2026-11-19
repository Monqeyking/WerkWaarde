import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "../lib/site";
import { SITE_JSON_LD, pageMetadata } from "../lib/seo";
import AdSenseHead from "./components/AdSenseHead";
import JsonLd from "./components/JsonLd";
import "./globals.css";

export const metadata: Metadata = {
  ...pageMetadata({ path: "/" }),
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} | ${SITE_TAGLINE}`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  return <html lang="nl"><head>{publisherId && <AdSenseHead publisherId={publisherId} />}</head><body>{children}<JsonLd data={SITE_JSON_LD} /></body></html>;
}
