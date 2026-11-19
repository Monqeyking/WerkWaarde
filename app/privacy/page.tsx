import type { Metadata } from "next";
import JsonLd from "../components/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "../../lib/seo";
import Link from "next/link";
import LegalPage from "../components/LegalPage";
import { houseAdAdvertisers } from "../../lib/ads";
import { CONTACT_EMAIL, OPERATOR, SITE_NAME } from "../../lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/privacy",
  title: "Privacybeleid",
  description: "Welke gegevens Nettoplaatje verwerkt: je invoer blijft in je eigen browser, wat de hosting logt en wat er gebeurt met advertenties.",
});

function Contact() {
  return CONTACT_EMAIL ? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> : <Link href="/contact">de contactpagina</Link>;
}

export default function PrivacyPage() {
  return <><JsonLd data={breadcrumbJsonLd([["Privacy", "/privacy"]])} /><LegalPage adPlacement="privacy" eyebrow="Nettoplaatje" title="Privacybeleid" intro="Laatst bijgewerkt: 16 november 2026.">
    <h2>Wie we zijn</h2>
    <p>{SITE_NAME} biedt gratis calculators voor salaris, mobiliteit en de kosten van werken. Je kunt ze gebruiken zonder account.{OPERATOR.name && <> {SITE_NAME} wordt beheerd door {OPERATOR.name}{OPERATOR.address && <>, {OPERATOR.address}</>}{OPERATOR.kvk && <> (KvK {OPERATOR.kvk})</>}. {OPERATOR.name} is verantwoordelijk voor de verwerking van persoonsgegevens op deze site.</>} Vragen over privacy stel je via <Contact />.</p>

    <h2>Wat je invult, blijft bij jou</h2>
    <p>De bedragen en keuzes die je in de calculators invult, worden alleen in je eigen browser berekend. Ze worden niet naar onze server gestuurd en wij kunnen ze niet inzien. Je browser bewaart ze lokaal, zodat ze blijven staan als je terugkomt of naar een andere calculator gaat. Met de knop Opnieuw beginnen in het totaaloverzicht, of door je browsergegevens te wissen, verwijder je ze.</p>
    <p>Als je een vergelijking deelt, staan je ingevulde bedragen in de link zelf, in het deel na het hekje (#). Dat deel stuurt een browser niet naar een server. Iedereen die de link krijgt, kan de bedragen wel zien. Deel hem dus alleen met mensen die dat mogen.</p>

    <h2>Bezoekgegevens en hosting</h2>
    <p>De site draait bij Cloudflare Inc. Zoals elke webserver verwerkt Cloudflare bij elk bezoek technische gegevens: je IP-adres, de opgevraagde pagina, het type browser en het tijdstip. Dat is nodig om de site te leveren en te beveiligen tegen misbruik (gerechtvaardigd belang). Cloudflare bewaart deze gegevens volgens zijn eigen bewaartermijnen.</p>
    <p>Cloudflare en Google zijn Amerikaanse bedrijven en kunnen gegevens buiten de Europese Unie verwerken. Dat gebeurt op basis van het EU-VS Data Privacy Framework of de standaardcontractbepalingen van de Europese Commissie.</p>

    <h2>Advertenties van Google</h2>
    <p>{SITE_NAME} is gratis dankzij advertenties van Google AdSense. Google en zijn partners gebruiken cookies om advertenties te tonen op basis van je bezoek aan deze en andere websites.</p>
    <p>Bezoekers uit de Europese Economische Ruimte, het Verenigd Koninkrijk en Zwitserland krijgen eerst een toestemmingsmelding. Zonder toestemming krijg je alleen niet-gepersonaliseerde advertenties. Je kunt gepersonaliseerde advertenties ook uitzetten via de <a href="https://adssettings.google.com" rel="noopener" target="_blank">advertentie-instellingen van Google</a>. Lees meer over <a href="https://policies.google.com/technologies/partner-sites" rel="noopener" target="_blank">hoe Google gegevens gebruikt op sites van partners</a>.</p>
    <p>Een deel van de advertenties plaatsen we zelf, voor {houseAdAdvertisers().join(" en ")}. Die gebruiken geen cookies en volgen je niet. Alleen als je erop klikt, ziet de adverteerder via de link dat je van {SITE_NAME} komt.</p>

    <h2>Geen analytics, geen verkoop</h2>
    <p>We gebruiken geen eigen analytics- of trackingdiensten en verkopen geen gegevens.</p>

    <h2>Als je ons mailt</h2>
    <p>Mail je ons, dan gebruiken we je e-mailadres en bericht alleen om je te antwoorden. We bewaren je bericht zolang dat nodig is om je vraag af te handelen en verwijderen het uiterlijk een jaar daarna.</p>

    <h2>Jouw rechten</h2>
    <p>Je hebt het recht om je gegevens in te zien, te laten corrigeren of verwijderen, de verwerking te laten beperken, bezwaar te maken en je gegevens over te laten dragen. Stuur je verzoek via <Contact />. We reageren binnen een maand. Ben je het niet eens met hoe we met je gegevens omgaan, dan kun je een klacht indienen bij de <a href="https://autoriteitpersoonsgegevens.nl" rel="noopener" target="_blank">Autoriteit Persoonsgegevens</a>.</p>

    <h2>Wijzigingen</h2>
    <p>Verandert de werking van {SITE_NAME}, dan passen we dit beleid aan. Bovenaan staat de datum van de laatste wijziging.</p>
  </LegalPage></>;
}
