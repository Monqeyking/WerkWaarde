import type { Metadata } from "next";
import JsonLd from "../components/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "../../lib/seo";
import LegalPage from "../components/LegalPage";

export const metadata: Metadata = pageMetadata({
  path: "/cookies",
  title: "Cookiebeleid",
  description: "Welke cookies en lokale opslag Nettoplaatje gebruikt, waarvoor, en hoe je je toestemming voor advertentiecookies beheert.",
});

export default function CookiesPage() {
  return <><JsonLd data={breadcrumbJsonLd([["Cookies", "/cookies"]])} /><LegalPage adPlacement="cookies" eyebrow="Nettoplaatje" title="Cookiebeleid" intro="Laatst bijgewerkt: 16 november 2026.">
    <h2>Functionele werking</h2>
    <p>De calculators werken zonder account. Nettoplaatje gebruikt geen eigen trackingcookies.</p>
    <p>Wat je invult, bewaart je browser in de lokale opslag (localStorage) van dit apparaat. Zo blijven je gegevens staan als je terugkomt of naar een andere calculator gaat. Dit is nodig voor de werking van de site. De gegevens gaan niet naar onze server en worden niet gebruikt om je te volgen. Je verwijdert ze met de knop Opnieuw beginnen in het totaaloverzicht of door je browsergegevens te wissen.</p>

    <h2>AdSense en toestemmingen</h2>
    <p>Voor advertenties gebruiken we Google AdSense. Google en zijn partners kunnen daarvoor cookies of vergelijkbare opslag gebruiken. Bezoekers uit de Europese Economische Ruimte, het Verenigd Koninkrijk en Zwitserland krijgen eerst een toestemmingsmelding van Google en kiezen daar zelf.</p>
    <p>Een deel van de advertenties zijn advertenties die we zelf plaatsen. Die gebruiken geen cookies en volgen je niet; alleen als je erop klikt, ziet de adverteerder via de link dat je van Nettoplaatje komt.</p>

    <h2>Keuze aanpassen</h2>
    <p>Je kunt je toestemming later intrekken via de link voor privacy- en cookie-instellingen in de toestemmingsmelding. Je kunt cookies ook blokkeren in je browser; sommige onderdelen van externe diensten kunnen dan anders werken.</p>
  </LegalPage></>;
}
