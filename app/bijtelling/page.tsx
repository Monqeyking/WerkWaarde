import type { Metadata } from "next";
import JsonLd from "../components/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "../../lib/seo";
import SpokePage from "../components/SpokePage";
import BijtellingCalculator from "./BijtellingCalculator";

export const metadata: Metadata = pageMetadata({
  path: "/bijtelling",
  title: "Bijtelling 2026: wat kost een leaseauto?",
  description: "Bereken je bijtelling in 2026 en wat een leaseauto je netto per maand kost. Elektrisch of brandstof, met eigen bijdrage.",
});

const how = [
  ["Bijtelling", "Een percentage van de cataloguswaarde telt als loon. In 2026 is dat 22%. Voor een volledig elektrische auto 18% over de eerste € 30.000 en 22% over de rest."],
  ["Eigen bijdrage eraf", "Betaal je zelf mee voor privégebruik, dan gaat die bijdrage van de bijtelling af. Je betaalt dan minder belasting, maar wel de bijdrage zelf."],
  ["Belasting tegen je hoogste tarief", "De bijtelling komt bovenop je salaris. We rekenen het verschil in belasting uit met en zonder bijtelling, dus inclusief de afbouw van heffingskortingen."],
  ["Wat je niet betaalt", "Brandstof of laden, onderhoud en verzekering betaalt bij de meeste leaseauto's de werkgever. Die kosten tellen hier dus niet mee."],
] as const;

const faqs = [
  ["Betaal ik de bijtelling zelf?", "Nee. De bijtelling is een bedrag dat bij je loon wordt opgeteld om belasting over te berekenen. Wat je echt betaalt, is de extra belasting daarover, plus een eventuele eigen bijdrage."],
  ["Hoeveel bijtelling betaal ik voor een elektrische auto in 2026?", "Over de eerste € 30.000 van de cataloguswaarde geldt 18%, over het deel daarboven 22%. Bij een auto van € 40.000 is de bijtelling dus € 5.400 plus € 2.200: € 7.600 per jaar."],
  ["Is een leaseauto voordeliger dan een mobiliteitsbudget?", "Dat hangt af van je budget, hoeveel je rijdt en wat een eigen auto je kost. Met de mobiliteitsvergelijking zet je de opties naast elkaar."],
  ["Wat is de cataloguswaarde?", "De officiële nieuwprijs inclusief btw en bpm, inclusief opties van de fabriek. Kortingen tellen niet mee. Je vindt hem in de leaseofferte."],
] as const;

export default function BijtellingPage() {
  return <><JsonLd data={breadcrumbJsonLd([["Bijtelling berekenen", "/bijtelling"]])} /><SpokePage active="mobility" kicker="Bijtelling" title="Wat kost een leaseauto je netto?"
    intro="Bereken de bijtelling van je leaseauto en wat die je per maand echt kost: de extra belasting plus je eigen bijdrage."
    calculator={<BijtellingCalculator />} how={how} faqs={faqs} adPlacement="bijtelling"
    articles={["wat-is-bijtelling", "leaseauto-of-mobiliteitsbudget", "kilometervergoeding-onbelast"]} /></>;
}
