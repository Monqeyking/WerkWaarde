import type { Metadata } from "next";
import Link from "next/link";
import SpokePage from "../components/SpokePage";
import DeeltijdCalculator from "./DeeltijdCalculator";

export const metadata: Metadata = {
  title: "Deeltijd of voltijd: wat levert een dag extra werken op?",
  description: "Bereken wat 24, 32 of 40 uur werken je huishouden netto oplevert, na belasting, kinderopvang, kinderopvangtoeslag, kindgebonden budget en zorgtoeslag.",
  alternates: { canonical: "/deeltijd" },
};

const PROEFBEREKENING = "https://www.belastingdienst.nl/wps/wcm/connect/nl/toeslagen/content/hulpmiddel-proefberekening-toeslagen";

const how = [
  ["Zelfde uurloon", "We rekenen met je huidige uurloon. Bruto salaris, vakantiegeld, bonus en pensioen schalen mee met je uren. De pensioenfranchise schaalt mee met je deeltijdfactor."],
  ["Belasting op je hoogste tarief", "Extra uren worden belast tegen je marginale tarief. Daarin zit ook de afbouw van de algemene heffingskorting en de arbeidskorting."],
  ["Toeslagen op je huishouden", "Kinderopvangtoeslag, kindgebonden budget en zorgtoeslag hangen af van het toetsingsinkomen van jou en je partner. Een leaseauto telt daarin mee via de bijtelling."],
  ["Opvang en reizen", "Een dag meer werken is vaak ook een opvangdag en een kantoordag meer. Die kosten gaan er weer af."],
] as const;

const faqs = [
  ["Loont 4 dagen werken in plaats van 5?", "Vaak minder dan je denkt. Een vijfde dag levert 25% meer bruto op, maar door belasting, een lagere kinderopvangtoeslag en een extra opvangdag houdt een gezin met jonge kinderen er soms maar een kwart van over."],
  ["Wat is marginale druk?", "Het deel van een extra euro bruto dat je niet overhoudt: belasting, wegvallende heffingskortingen en toeslagen, en extra kosten. Bij een marginale druk van 70% houd je van € 100 bruto extra € 30 over."],
  ["Telt mijn leaseauto mee voor toeslagen?", "Ja. De bijtelling hoort bij je inkomen in box 1, dus ook bij je toetsingsinkomen. Met een leaseauto kun je daardoor minder kinderopvangtoeslag of kindgebonden budget krijgen."],
  ["Hangt kinderopvangtoeslag af van hoeveel ik werk?", "Niet meer van het aantal uren: sinds 2023 krijg je toeslag voor alle opvanguren, tot 230 uur per maand per kind. Wel moeten jij en je toeslagpartner allebei werken, en het percentage hangt af van jullie gezamenlijke inkomen."],
  ["Rekenen jullie huurtoeslag mee?", "Nee. Huurtoeslag hangt af van je huur, servicekosten en huishouden. Gebruik daarvoor de proefberekening van de Belastingdienst. Bedenk dat huurtoeslag ook daalt als je meer gaat verdienen."],
] as const;

const disclaimer = <>
  <p>De uitkomst is een schatting op basis van je invoer en de regels van 2026. Toeslagen rekenen we over een heel jaar op het toetsingsinkomen van je huishouden, zonder box 3 en zonder wisselingen in de loop van het jaar. Huurtoeslag rekenen we niet mee. Wat je echt krijgt, stelt Dienst Toeslagen vast: controleer het met de <a href={PROEFBEREKENING} target="_blank" rel="noreferrer">proefberekening</a>. Lees meer in de <Link href="/uitleg">uitleg over de rekenmethode</Link>.</p>
  <div className="sources">Bronnen: <a href="https://www.rijksoverheid.nl/onderwerpen/kinderopvangtoeslag/bedragen-kinderopvangtoeslag-2026" target="_blank" rel="noreferrer">bedragen kinderopvangtoeslag 2026</a> · <a href="https://www.belastingdienst.nl/wps/wcm/connect/nl/zorgtoeslag/content/hoeveel-zorgtoeslag" target="_blank" rel="noreferrer">zorgtoeslag 2026</a> · <a href="https://zoek.officielebekendmakingen.nl/stcrt-2025-42977.html" target="_blank" rel="noreferrer">normpremie zorgtoeslag</a> · <a href="https://www.belastingdienst.nl/wps/wcm/connect/nl/kindgebonden-budget/content/hoeveel-kindgebonden-budget" target="_blank" rel="noreferrer">kindgebonden budget</a> · gecontroleerd op 18 november 2026</div>
</>;

export default function DeeltijdPage() {
  return <SpokePage active="work" kicker="Deeltijd of voltijd" title="Wat levert een dag extra werken op?"
    intro="Zie per aantal uren wat je huishouden netto overhoudt, na belasting, kinderopvang en toeslagen. Zo weet je wat een dag meer of minder werken je echt kost of oplevert."
    calculator={<DeeltijdCalculator />} how={how} faqs={faqs} adPlacement="deeltijd" disclaimer={disclaimer}
    articles={["loont-meer-uren-werken", "kinderopvangtoeslag-2026", "kindgebonden-budget-2026"]} />;
}
