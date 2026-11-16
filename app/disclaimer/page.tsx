import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "../components/LegalPage";
import { houseAdAdvertisers } from "../../lib/ads";
import { OPERATOR, SITE_NAME } from "../../lib/site";

export const metadata: Metadata = {
  title: "Disclaimer en gebruiksvoorwaarden",
  description: "De uitkomsten van Nettoplaatje zijn indicaties, geen advies. Lees wat je wel en niet van de calculators mag verwachten.",
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  const owner = OPERATOR.name || SITE_NAME;
  return <LegalPage adPlacement="disclaimer" eyebrow="Nettoplaatje" title="Disclaimer en gebruiksvoorwaarden" intro="Laatst bijgewerkt: 16 november 2026. Door deze site te gebruiken, ga je akkoord met deze voorwaarden.">
    <h2>Een indicatie, geen advies</h2>
    <p>De uitkomsten van {SITE_NAME} zijn schattingen op basis van wat je invult en van vereenvoudigde rekenregels. Ze zijn geen financieel, fiscaal, juridisch of pensioenadvies. Je werkelijke netto inkomen hangt af van je loonstrook, cao, pensioenregeling, toeslagen en persoonlijke situatie. Neem belangrijke beslissingen, zoals het aannemen van een baan of het kiezen van een leaseauto, niet alleen op basis van deze site. Raadpleeg bij twijfel je werkgever, de Belastingdienst of een adviseur.</p>

    <h2>Rekenregels en tarieven</h2>
    <p>We rekenen met de belastingtarieven, heffingskortingen en bijtellingsregels van het jaar dat bij de calculator staat. We doen ons best om die juist en actueel te houden, maar we garanderen niet dat alle informatie en berekeningen foutloos, volledig of up-to-date zijn. Regels kunnen tussentijds veranderen. Zie je een fout? <Link href="/contact">Laat het ons weten</Link>.</p>

    <h2>Aansprakelijkheid</h2>
    <p>Je gebruikt {SITE_NAME} op eigen risico. {owner} is niet aansprakelijk voor schade die ontstaat door het gebruik van de site of door beslissingen die je neemt op basis van de uitkomsten, voor zover de wet dat toestaat. Dat geldt ook als de site tijdelijk niet beschikbaar is of fouten bevat.</p>

    <h2>Advertenties en externe links</h2>
    <p>{SITE_NAME} toont advertenties van Google en advertenties die we zelf plaatsen voor {houseAdAdvertisers().join(" en ")}. Alle advertenties zijn gemarkeerd als advertentie en hebben geen invloed op de berekeningen. We zijn niet verantwoordelijk voor de inhoud van websites waarnaar advertenties of links verwijzen.</p>

    <h2>Gedeelde links</h2>
    <p>Een gedeelde link bevat de bedragen die je hebt ingevuld. Je bent zelf verantwoordelijk voor met wie je zo&rsquo;n link deelt.</p>

    <h2>Intellectueel eigendom</h2>
    <p>De teksten, rekenmodellen, vormgeving en code van {SITE_NAME} zijn eigendom van {owner}. Je mag naar de site linken en uitkomsten voor eigen gebruik bewaren of delen. Overnemen, kopiëren of hergebruiken van de site of delen ervan mag alleen met schriftelijke toestemming.</p>

    <h2>Toepasselijk recht</h2>
    <p>Op het gebruik van {SITE_NAME} en op deze voorwaarden is Nederlands recht van toepassing.</p>
  </LegalPage>;
}
