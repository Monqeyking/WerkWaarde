import type { Metadata } from "next";
import JsonLd from "../components/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "../../lib/seo";
import SpokePage from "../components/SpokePage";
import KilometerCalculator from "./KilometerCalculator";

export const metadata: Metadata = pageMetadata({
  path: "/kilometervergoeding",
  title: "Kilometervergoeding 2026: dekt het je kosten?",
  description: "Wat houd je over aan je kilometervergoeding in 2026? Onbelast tot € 0,25 per km. Zie of het je brandstof en autokosten dekt.",
});

const how = [
  ["Kilometers per jaar", "Uit je kantoordagen, werkweken en de afstand enkele reis rekenen we je woon-werkkilometers. Daar tellen we je overige zakelijke ritten bij op."],
  ["Onbelast tot € 0,25", "In 2026 mag je werkgever maximaal € 0,25 per zakelijke km onbelast vergoeden. Krijg je meer, dan betaal je over het deel daarboven belasting tegen je hoogste tarief."],
  ["Kosten per km", "Brandstof of laden volgt uit je verbruik en de prijs. Daar komen de overige kosten per km bij, zoals onderhoud en verzekering."],
  ["Saldo", "Vergoeding na belasting min de kosten van die kilometers. Afschrijving rekenen we niet mee, omdat je die meestal ook zonder deze ritten hebt."],
] as const;

const faqs = [
  ["Hoeveel kilometervergoeding is onbelast in 2026?", "Maximaal € 0,25 per zakelijke kilometer. Woon-werkverkeer telt hierbij als zakelijk. Vergoedt je werkgever meer, dan is het deel boven € 0,25 belast loon."],
  ["Dekt € 0,25 per km mijn autokosten?", "Dat hangt af van je auto. Alleen brandstof kost bij een verbruik van 1 op 15 en € 2 per liter al ruim € 0,13 per km. Met onderhoud, banden en verzekering erbij kom je vaak in de buurt van de vergoeding of erboven."],
  ["Krijg ik kilometervergoeding als ik thuiswerk?", "Nee, de vergoeding geldt alleen voor kilometers die je echt rijdt. Wel kan je werkgever op thuiswerkdagen een thuiswerkvergoeding geven."],
  ["Is een mobiliteitsbudget beter dan kilometervergoeding?", "Bij een mobiliteitsbudget krijg je een vast bruto bedrag, waarvan een deel belast is. Vergelijk het met de mobiliteitscalculator."],
] as const;

export default function KilometerPage() {
  return <><JsonLd data={breadcrumbJsonLd([["Kilometervergoeding", "/kilometervergoeding"]])} /><SpokePage active="mobility" kicker="Kilometervergoeding" title="Dekt je kilometervergoeding je autokosten?"
    intro="Bereken hoeveel je overhoudt of toelegt als je met je eigen auto naar je werk rijdt. Met het onbelaste maximum van 2026 en de kosten van jouw auto."
    calculator={<KilometerCalculator />} how={how} faqs={faqs} adPlacement="kilometervergoeding"
    articles={["kilometervergoeding-onbelast", "leaseauto-of-mobiliteitsbudget", "reistijd-meetellen-nieuwe-baan"]} /></>;
}
