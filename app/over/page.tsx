import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "../components/JsonLd";
import LegalPage from "../components/LegalPage";
import { CAOS } from "../../lib/caos";
import { CALCULATORS } from "../../lib/calculators";
import { ORGANIZATION_ID, breadcrumbList, pageMetadata } from "../../lib/seo";
import { OPERATOR, SITE_NAME, SITE_URL } from "../../lib/site";
import { TAX_YEARS } from "../../lib/tax-years";

export const metadata: Metadata = pageMetadata({
  path: "/over",
  title: "Over Nettoplaatje: wie we zijn en hoe we rekenen",
  description: "Wie Nettoplaatje maakt, hoe we rekenen, welke bronnen we gebruiken, hoe actueel de cijfers zijn en hoe de site wordt betaald.",
});

/** Recent changes, newest first. Add a line when something users notice changes. */
const UPDATES: ReadonlyArray<readonly [date: string, text: string]> = [
  ["19 november 2026", "Een pagina per cao, met pensioenpremie, 13e maand en rekenvoorbeelden voor 22 cao's."],
  ["19 november 2026", "De inkomensafhankelijke combinatiekorting telt mee in de deeltijdcalculator en het totaaloverzicht."],
  ["18 november 2026", "Nieuwe calculator: wat levert een dag extra werken op, na toeslagen en kinderopvang?"],
  ["16 november 2026", "Kies je cao, dan vullen we vakantiegeld, 13e maand en pensioenpremie voor je in."],
  ["16 november 2026", "Pagina's per brutobedrag, van € 2.000 tot € 10.000 per maand."],
];

const SOURCES: ReadonlyArray<readonly [label: string, href: string]> = [
  ["Tarieven en heffingskortingen (Belastingdienst)", "https://www.belastingdienst.nl/wps/wcm/connect/nl/voorlopige-aanslag/content/voorlopige-aanslag-tarieven-en-heffingskortingen"],
  ["Bijtelling 2026 (Belastingdienst)", "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/inkomstenbelasting/veranderingen-inkomstenbelasting-2026/bijtelling-privegebruik-auto-2026"],
  ["Onbelaste kilometervergoeding (Belastingdienst)", "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/berichten/nieuws/verhoging-onbelaste-kilometervergoeding-hoe-verwerkt-u-dit-in-de-loonaangifte"],
  ["Inkomensafhankelijke combinatiekorting (Belastingdienst)", "https://www.belastingdienst.nl/iack"],
  ["Bedragen kinderopvangtoeslag 2026 (Rijksoverheid)", "https://www.rijksoverheid.nl/onderwerpen/kinderopvangtoeslag/bedragen-kinderopvangtoeslag-2026"],
  ["Zorgtoeslag (Dienst Toeslagen)", "https://www.belastingdienst.nl/wps/wcm/connect/nl/zorgtoeslag/content/hoeveel-zorgtoeslag"],
  ["Kindgebonden budget (Dienst Toeslagen)", "https://www.belastingdienst.nl/wps/wcm/connect/nl/kindgebonden-budget/content/hoeveel-kindgebonden-budget"],
];

/** "16 november 2026" for an ISO date. */
const dateText = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default function AboutPage() {
  const operator = OPERATOR.name || SITE_NAME;
  const lastCaoCheck = CAOS.map((cao) => cao.checkedOn).sort().at(-1)!;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "AboutPage", "@id": `${SITE_URL}/over`, url: `${SITE_URL}/over`, name: `Over ${SITE_NAME}`, inLanguage: "nl-NL", about: { "@id": ORGANIZATION_ID } },
      breadcrumbList([["Over Nettoplaatje", "/over"]]),
    ],
  };

  return <><JsonLd data={jsonLd} /><LegalPage adPlacement="over" eyebrow="Over ons" title={`Over ${SITE_NAME}`}
    intro="Een nieuwe baan is meer dan een hoger brutosalaris. Nettoplaatje laat zien wat je echt overhoudt: na belasting en pensioen, met je auto, je reistijd en je toeslagen erbij.">
    <h2>Wat Nettoplaatje is</h2>
    <p>{SITE_NAME} is een gratis verzameling calculators voor werknemers in loondienst. Je vergelijkt twee banen, rekent bruto naar netto, ziet wat een leaseauto of mobiliteitsbudget kost en wat een dag meer of minder werken je huishouden oplevert. Je hebt geen account nodig. Wat je invult blijft in je eigen browser en komt niet op onze server.</p>
    <p>Er zijn nu {CALCULATORS.length} calculators, uitleg bij veelgestelde vragen en een pagina per cao voor {CAOS.length} grote cao&apos;s.</p>

    <h2>Wie het maakt</h2>
    <p>{SITE_NAME} wordt gemaakt en beheerd door {operator}{OPERATOR.kvk && <> (KvK {OPERATOR.kvk})</>}. We bouwen de calculators zelf, houden de cijfers bij en lossen fouten op die bezoekers ons melden.</p>

    <h2>Hoe we rekenen</h2>
    <p>Alle calculators gebruiken één rekenmodel. Daardoor geeft de bruto-nettocalculator hetzelfde netto als het totaaloverzicht of een cao-pagina. We rekenen met de jaartarieven en heffingskortingen, de bijtelling en de onbelaste kilometervergoeding van het gekozen jaar. Pensioenpremie rekenen we volgens de regeling van je cao, of met het bedrag dat je zelf invult. Toeslagen rekenen we op het toetsingsinkomen van je huishouden. De details en voorbeelden staan op <Link href="/uitleg">Hoe werkt Nettoplaatje?</Link></p>
    <p>De rekenregels worden bij elke wijziging gecontroleerd met automatische tests. Die controleren bijvoorbeeld dat de onderdelen van een berekening optellen tot het eindbedrag en dat de heffingskortingen aflopen zoals in de officiële tabellen.</p>

    <h2>Bronnen</h2>
    <p>We gebruiken alleen officiële bronnen:</p>
    <ul className="about-list">{SOURCES.map(([label, href]) => <li key={href}><a href={href} target="_blank" rel="noreferrer">{label}</a></li>)}</ul>
    <p>Voor elke cao staan de cao-tekst en de premiegegevens van het pensioenfonds op de <Link href="/cao">cao-pagina&apos;s</Link>.</p>

    <h2>Hoe actueel de cijfers zijn</h2>
    <ul className="about-list">
      {TAX_YEARS.map((year) => <li key={year.year}><strong>{year.year}</strong>: {year.published ? <>definitief. Bron: {year.source}.</> : <>nog niet te kiezen in de calculators. {year.source}.</>}</li>)}
      <li><strong>Cao&apos;s en pensioenfondsen</strong>: laatst gecontroleerd op {dateText(lastCaoCheck)}.</li>
    </ul>
    <p>Nieuwe belastingcijfers zetten we pas online als ze definitief zijn. Tot die tijd rekenen we met het lopende jaar.</p>

    <h2>Laatste wijzigingen</h2>
    <ul className="about-list">{UPDATES.map(([date, text]) => <li key={date + text}><strong>{date}</strong>: {text}</li>)}</ul>

    <h2>Hoe de site wordt betaald</h2>
    <p>{SITE_NAME} is gratis en betaalt zich met advertenties: van Google AdSense en eigen advertenties, onder meer voor Virtrust. Advertenties staan altijd in een vak met &lsquo;Advertentie&rsquo; erboven. Adverteerders hebben geen invloed op de berekeningen of de uitleg. We gebruiken geen affiliate-links en verkopen geen plekken in vergelijkingen. Lees in de <Link href="/cookies">cookieverklaring</Link> welke cookies daarbij horen.</p>

    <h2>Grenzen</h2>
    <p>De uitkomsten zijn een indicatie, geen financieel advies. Je loonstrook kan afwijken door maandtabellen, andere inhoudingen of afspraken die we niet kennen. Voor zzp&apos;ers, een dga-constructie, emigratie of een grote beslissing over je pensioen ga je beter naar een adviseur. Lees ook de <Link href="/disclaimer">disclaimer</Link>.</p>

    <h2>Fout gevonden?</h2>
    <p>Klopt een bedrag niet, of is een cao veranderd? Laat het ons weten via de <Link href="/contact">contactpagina</Link>. Vermeld de calculator en wat je hebt ingevuld, dan zoeken we het uit en passen we het aan.</p>
  </LegalPage></>;
}
