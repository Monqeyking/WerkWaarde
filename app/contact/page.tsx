import type { Metadata } from "next";
import JsonLd from "../components/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "../../lib/seo";
import LegalPage from "../components/LegalPage";
import { CONTACT_EMAIL, OPERATOR, SITE_NAME } from "../../lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/contact",
  title: "Contact",
  description: "Vraag, fout in een berekening of suggestie voor Nettoplaatje? Zo neem je contact met ons op.",
});

export default function ContactPage() {
  return <><JsonLd data={breadcrumbJsonLd([["Contact", "/contact"]])} /><LegalPage adPlacement="contact" eyebrow="Nettoplaatje" title="Contact" intro="Heb je een vraag over de calculator, een fout gevonden of wil je iets delen?"><div className="contact-card">
    <h2>Neem contact op</h2>
    {CONTACT_EMAIL
      ? <p>Mail naar <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Vermeld bij een foutmelding bij voorkeur de gebruikte calculator en de stappen waarmee je de fout zag.</p>
      : <p>Het contactadres wordt binnenkort hier vermeld.</p>}
    {OPERATOR.name && <>
      <h2>Over {SITE_NAME}</h2>
      <p>{SITE_NAME} is gemaakt en wordt beheerd door {OPERATOR.website ? <a href={OPERATOR.website} rel="noopener">{OPERATOR.name}</a> : OPERATOR.name}.{OPERATOR.address && <> Adres: {OPERATOR.address}.</>}{OPERATOR.kvk && <> KvK-nummer: {OPERATOR.kvk}.</>}</p>
    </>}
  </div></LegalPage></>;
}
