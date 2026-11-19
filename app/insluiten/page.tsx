import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "../components/JsonLd";
import LegalPage from "../components/LegalPage";
import CopyCode from "./CopyCode";
import { EMBED_HEIGHT, EMBED_PATH, embedSnippet } from "../../lib/embed";
import { breadcrumbJsonLd, pageMetadata } from "../../lib/seo";
import { DEFAULT_TAX_YEAR } from "../../lib/tax-years";

export const metadata: Metadata = pageMetadata({
  path: "/insluiten",
  title: "Gratis bruto-nettocalculator voor je eigen website",
  description: "Zet de bruto-nettocalculator van Nettoplaatje gratis op je eigen site. Eén stukje code, zonder cookies, advertenties of account.",
});

const faqs = [
  ["Wat kost het?", "Niets. Je mag de calculator gratis gebruiken op elke website, ook commercieel, zolang de regel met de link naar Nettoplaatje onder de calculator blijft staan."],
  ["Heb ik een cookiemelding nodig?", "Niet voor deze calculator. Hij plaatst geen cookies, slaat niets op in de browser van je bezoeker, toont geen advertenties en laadt geen code van andere partijen. Wat je bezoeker invult, blijft in die browser."],
  ["Werkt het in WordPress?", "Ja. Plak de code in een blok ‘Aangepaste HTML’. Staat je site geen scripts toe, laat dan de regel met embed.js weg. De calculator werkt dan ook, alleen met een vaste hoogte."],
  ["Blijven de cijfers actueel?", "Ja. De calculator haalt alles van Nettoplaatje. Als we de tarieven of een cao bijwerken, ziet jouw bezoeker meteen de nieuwe cijfers. Jij hoeft niets te doen."],
  ["Kan ik de kleuren of de grootte aanpassen?", "De breedte past zich aan je pagina aan, tot 640 pixels. Op een smal scherm staan invoer en uitkomst onder elkaar. Kleuren aanpassen kan nu nog niet."],
] as const;

export default function EmbedInfoPage() {
  return <><JsonLd data={breadcrumbJsonLd([["Calculator op je site", "/insluiten"]])} /><LegalPage adPlacement="insluiten" eyebrow="Voor websites"
    title="Zet de bruto-nettocalculator op je eigen site"
    intro="Schrijf je over salaris, werk of geldzaken? Geef je lezers een calculator die klopt en bijgehouden wordt. Gratis, zonder cookies en met één stukje code.">
    <h2>Zo ziet het eruit</h2>
    <p>Dit is de calculator zoals hij op jouw site komt te staan. Probeer hem gerust.</p>
    <iframe className="embed-preview" src={EMBED_PATH} title="Voorbeeld: bruto-nettocalculator van Nettoplaatje" data-nettoplaatje style={{ height: EMBED_HEIGHT }} />
    <script src="/embed.js" async />

    <h2>Zo zet je hem op je site</h2>
    <p>Kopieer deze code en plak hem op de plek waar de calculator moet komen, bijvoorbeeld in een blok ‘Aangepaste HTML’ in WordPress.</p>
    <CopyCode code={embedSnippet()} />
    <p>De code bestaat uit drie regels:</p>
    <ul className="about-list">
      <li>de calculator zelf, in een iframe;</li>
      <li>een regel met een link naar Nettoplaatje. Die moet blijven staan: zo kunnen we de calculator gratis houden;</li>
      <li>een klein script dat de hoogte aanpast aan de calculator. Dat mag je weglaten.</li>
    </ul>

    <h2>Wat je bezoekers krijgen</h2>
    <p>Ze vullen hun bruto maandsalaris en uren in, en kiezen eventueel hun cao. Ze zien dan meteen hun netto per maand, de pensioenpremie, de loonheffing en het netto per jaar. Met de cijfers van {DEFAULT_TAX_YEAR}, dezelfde als in de <Link href="/bruto-netto">volledige calculator</Link>. Wie meer wil weten, opent met één klik Nettoplaatje met hetzelfde salaris ingevuld.</p>

    <h2>Veelgestelde vragen</h2>
    <div className="faq-list">{faqs.map(([question, answer]) => <details className="faq-item" key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>

    <h2>Vragen of een andere calculator nodig?</h2>
    <p>Wil je liever de bijtelling- of kilometervergoedingscalculator op je site, of werkt de code niet? <Link href="/contact">Laat het ons weten</Link>.</p>
  </LegalPage></>;
}
