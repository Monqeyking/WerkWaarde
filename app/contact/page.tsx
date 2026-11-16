import type { Metadata } from "next";
import LegalPage from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact opnemen met Nettoplaatje.",
};

export default function ContactPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return <LegalPage adPlacement="contact" eyebrow="Nettoplaatje" title="Contact" intro="Heb je een vraag over de calculator, een fout gevonden of wil je iets delen?"><div className="contact-card">
    <h2>Neem contact op</h2>
    {contactEmail
      ? <p>Mail naar <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. Vermeld bij een foutmelding bij voorkeur de gebruikte calculator en de stappen waarmee je de fout zag.</p>
      : <p>Het contactadres wordt binnenkort hier vermeld.</p>}
  </div></LegalPage>;
}
