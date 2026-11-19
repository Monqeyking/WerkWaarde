import type { Metadata } from "next";
import EmbedCalculator from "./EmbedCalculator";

/** Shown inside other sites' iframes. Kept out of search results: /bruto-netto is the page to find. */
export const metadata: Metadata = {
  title: { absolute: "Bruto-nettocalculator | Nettoplaatje" },
  robots: { index: false, follow: true },
  alternates: { canonical: "/bruto-netto" },
};

export default function EmbedBrutoNettoPage() {
  return <EmbedCalculator />;
}
