import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WerkWaarde | Wat houd je écht over van je werk?",
  description: "Vergelijk salaris, pensioen, mobiliteit, reistijd en de totale waarde van een baan.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="nl"><body>{children}</body></html>;
}
