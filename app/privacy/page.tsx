import type { Metadata } from "next";
import LegalPage from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Privacybeleid | WerkWaarde",
  description: "Het privacybeleid van WerkWaarde.",
};

export default function PrivacyPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return <LegalPage eyebrow="WerkWaarde" title="Privacybeleid" intro="Laatst bijgewerkt: 17 september 2026.">
    <h2>Wat WerkWaarde doet</h2>
    <p>WerkWaarde biedt indicatieve calculators voor salaris, mobiliteit en de kosten van werken. Je kunt de calculators gebruiken zonder account.</p>

    <h2>Welke gegevens we verwerken</h2>
    <p>De bedragen en keuzes die je in de calculator invult, worden in deze versie alleen in je browser gebruikt en niet door WerkWaarde opgeslagen op een server. De site verwerkt daarnaast de technische gegevens die nodig zijn om een webpagina veilig te leveren.</p>

    <h2>Advertenties</h2>
    <p>Als advertenties worden ingeschakeld, kan Google AdSense cookies of vergelijkbare opslag gebruiken en gegevens verwerken om advertenties te tonen en te meten. Voor bezoekers in de Europese Economische Ruimte, het Verenigd Koninkrijk en Zwitserland wordt hiervoor de toestemmingsmelding van Google of een andere gecertificeerde CMP gebruikt.</p>

    <h2>Jouw rechten</h2>
    <p>Je kunt vragen stellen over je privacy, inzage vragen of bezwaar maken tegen verwerking. Neem contact op via {contactEmail ? <a href={`mailto:${contactEmail}`}>{contactEmail}</a> : "het beheeradres dat in de Vercel-omgeving als NEXT_PUBLIC_CONTACT_EMAIL is ingesteld"}.</p>

    <h2>Wijzigingen</h2>
    <p>Wanneer de werking van WerkWaarde verandert, bijvoorbeeld door analytics, accounts of nieuwe advertentiepartners, passen we dit beleid aan.</p>
  </LegalPage>;
}
