import type { Metadata } from "next";
import LegalPage from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Cookiebeleid",
  description: "Het cookiebeleid van Nettoplaatje.",
};

export default function CookiesPage() {
  return <LegalPage adPlacement="cookies" eyebrow="Nettoplaatje" title="Cookiebeleid" intro="Laatst bijgewerkt: 17 september 2026.">
    <h2>Functionele werking</h2>
    <p>De calculators werken zonder account. Nettoplaatje gebruikt in deze versie geen eigen trackingcookies om je invoer op te slaan.</p>

    <h2>AdSense en toestemmingen</h2>
    <p>Wanneer Google AdSense actief is, kunnen Google en advertentiepartners cookies of vergelijkbare opslag gebruiken. Bezoekers uit de Europese Economische Ruimte, het Verenigd Koninkrijk en Zwitserland krijgen via de ingestelde gecertificeerde toestemmingspartner informatie over deze verwerking en kunnen hun keuze beheren.</p>
    <p>Een deel van de advertenties zijn advertenties die we zelf plaatsen. Die gebruiken geen cookies en volgen je niet; alleen als je erop klikt, ziet de adverteerder via de link dat je van Nettoplaatje komt.</p>

    <h2>Keuze aanpassen</h2>
    <p>Je kunt je toestemming later intrekken via de link voor privacy- en cookie-instellingen in de toestemmingsmelding. Je kunt cookies ook blokkeren in je browser; sommige onderdelen van externe diensten kunnen dan anders werken.</p>
  </LegalPage>;
}
