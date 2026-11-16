/** All calculator pages, used for the home page, footer, knowledge base and sitemap. */
export type CalculatorLink = { href: string; title: string; kicker: string; text: string };

export const CALCULATORS: readonly CalculatorLink[] = [
  { href: "/totaal", kicker: "Het hele plaatje", title: "Twee banen vergelijken", text: "Salaris, bonus, pensioen, auto, reiskosten en reistijd van je huidige en nieuwe baan in één overzicht." },
  { href: "/bruto-netto", kicker: "Salaris", title: "Bruto naar netto", text: "Wat houd je netto over per maand en per jaar, inclusief vakantiegeld, 13e maand en bonus?" },
  { href: "/mobiliteit", kicker: "Auto", title: "Leaseauto of mobiliteitsbudget", text: "Vergelijk een leaseauto, mobiliteitsbudget en eigen auto met kilometervergoeding." },
  { href: "/bijtelling", kicker: "Leaseauto", title: "Bijtelling berekenen", text: "Wat kost een leaseauto je netto per maand, met de bijtelling van 2026?" },
  { href: "/kilometervergoeding", kicker: "Eigen auto", title: "Kilometervergoeding", text: "Dekt je vergoeding de kosten van je auto, en hoeveel is onbelast?" },
  { href: "/werkpatroon", kicker: "Thuis of kantoor", title: "Wat kost vaker naar kantoor?", text: "Reistijd, autokosten, parkeren, lunch en opvang bij meer kantoordagen." },
  { href: "/arbeidsvoorwaarden", kicker: "Totale beloning", title: "Arbeidsvoorwaarden", text: "Tel pensioen, bonus, opleidingsbudget en extra vakantiedagen op tot je totale beloning." },
];
