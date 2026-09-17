import type { Metadata } from "next";
import LegalPage from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Hoe werkt WerkWaarde? | WerkWaarde",
  description: "Lees hoe WerkWaarde salaris, mobiliteit, reistijd en werkgerelateerde kosten vergelijkt.",
};

const faqs = [
  ["Is WerkWaarde financieel advies?", "Nee. De uitkomsten zijn indicaties op basis van de ingevulde gegevens. Je eigen loonstrook, pensioenregeling, cao en persoonlijke omstandigheden kunnen tot andere bedragen leiden."],
  ["Welke keuzes kan ik vergelijken?", "Je kunt een leaseauto, een uitbetaald mobiliteitsbudget en een eigen auto met kilometervergoeding naast elkaar zetten. In de tweede calculator vergelijk je een huidige en een nieuwe werksituatie."],
  ["Hoe wordt het netto loon berekend?", "We rekenen vanuit het bruto maandsalaris, vakantiegeld en de ingevulde pensioenbijdrage naar een indicatie van de loonheffing. De berekening gebruikt het gekozen belastingjaar."],
  ["Welke autokosten zijn meegenomen?", "Brandstof of laden, variabele autokosten, kilometervergoeding en optioneel afschrijving of een reserve. Parkeren en tol worden niet automatisch meegenomen omdat die sterk per situatie verschillen."],
  ["Waarom kan mijn loonstrook afwijken?", "Werkelijke loonheffing hangt onder meer af van heffingskortingen, pensioenregels, bijtelling, cao-afspraken en andere inhoudingen. WerkWaarde geeft daarom een vergelijkingsbeeld en geen exacte loonstrook."],
  ["Worden mijn gegevens opgeslagen?", "De calculators verwerken je invoer in je browser. In deze versie is geen account nodig en slaat WerkWaarde de ingevulde bedragen niet op een eigen server op."],
] as const;

export default function ExplanationPage() {
  return <LegalPage eyebrow="Transparant rekenen" title="Hoe werkt WerkWaarde?" intro="WerkWaarde maakt de waarde van een baan en mobiliteitskeuze inzichtelijk. Hieronder leggen we uit welke stappen en aannames de calculators gebruiken.">
    <h2>1. Bruto naar netto</h2>
    <p>We starten met het bruto maandsalaris en het vakantiegeld. De werknemersbijdrage voor pensioen verlaagt in deze indicatie het belastbare loon. Daarna berekenen we een geschatte loonheffing voor het gekozen belastingjaar. De werkgeversbijdrage pensioen tonen we apart als onderdeel van de arbeidsvoorwaarden.</p>

    <h2>2. Mobiliteitskeuze</h2>
    <p>Bij een leaseauto berekenen we de fiscale bijtelling en de eigen bijdrage. Bij een mobiliteitsbudget halen we eerst de onbelaste kilometervergoeding af en belasten we het resterende budget indicatief. Bij een eigen auto vergelijken we de kilometervergoeding met de brandstof- of laadkosten en de ingevulde overige autokosten.</p>

    <h2>3. Werkpatroon</h2>
    <p>De werkpatroon-calculator vergelijkt de oude en nieuwe situatie per maand en per jaar. Reistijd, kilometers, brandstof of laden, parkeren, lunch, kinderopvang en overige ingevulde werkgerelateerde kosten worden afzonderlijk getoond.</p>

    <h2>Belangrijkste aannames</h2>
    <p>De berekening gebruikt de tarieven en uitgangspunten die in de calculator worden vermeld. Parkeren en tol zijn niet standaard opgenomen. Bij een elektrische auto gebruiken we het ingevulde verbruik en de ingevulde energieprijs. Controleer belangrijke beslissingen altijd met je werkgever, loonstrook of belastingadviseur.</p>

    <h2>Veelgestelde vragen</h2>
    <div className="faq-list">{faqs.map(([question, answer]) => <details className="faq-item" key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>

    <h2>Bronnen</h2>
    <p>De calculator verwijst bij fiscale uitgangspunten naar de <a href="https://www.belastingdienst.nl/wps/wcm/connect/nl/voorlopige-aanslag/content/voorlopige-aanslag-tarieven-en-heffingskortingen" target="_blank" rel="noreferrer">Belastingdienst</a>, de informatie over <a href="https://centraalaanspreekpuntpensioenen.belastingdienst.nl/publicaties/overzicht-aow-inbouwbedragen-en-aow-franchises/" target="_blank" rel="noreferrer">AOW-franchises</a> en de regels voor <a href="https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/inkomstenbelasting/veranderingen-inkomstenbelasting-2026/bijtelling-privegebruik-auto-2026" target="_blank" rel="noreferrer">bijtelling in 2026</a>.</p>
  </LegalPage>;
}
