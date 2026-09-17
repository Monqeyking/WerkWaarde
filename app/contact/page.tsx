import type { Metadata } from "next";
import LegalPage from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Contact | WerkWaarde",
  description: "Contact opnemen met WerkWaarde.",
};

export default function ContactPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return <LegalPage eyebrow="WerkWaarde" title="Contact" intro="Heb je een vraag over de calculator, een fout gevonden of wil je iets delen?"><div className="contact-card">
    <h2>Neem contact op</h2>
    {contactEmail
      ? <p>Mail naar <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. Vermeld bij een foutmelding bij voorkeur de gebruikte calculator en de stappen waarmee je de fout zag.</p>
      : <p>Het contactadres wordt binnenkort toegevoegd. Voor technische meldingen kun je voorlopig een issue openen in het <a href="https://github.com/Monqeyking/WerkWaarde/issues" target="_blank" rel="noreferrer">WerkWaarde GitHub-project</a>.</p>}
  </div></LegalPage>;
}
