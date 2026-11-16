import type { Metadata } from "next";
import Link from "next/link";
import AdSenseSlot from "../components/AdSenseSlot";
import { SiteFooter, SiteNav } from "../components/SiteChrome";
import { SITE_NAME } from "../../lib/site";
import TotalCalculator from "./TotalCalculator";

export const metadata: Metadata = {
  title: "Twee banen vergelijken: wat houd je netto over?",
  description: "Vergelijk je huidige en nieuwe baan in één overzicht: netto salaris, bonus, pensioen, leaseauto of mobiliteitsbudget, reiskosten, reistijd en je netto uurloon.",
  alternates: { canonical: "/totaal" },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: SITE_NAME,
    title: "Wat levert een nieuwe baan je écht op?",
    description: "Vergelijk je huidige en nieuwe baan in één overzicht: netto salaris, pensioen, auto, reiskosten, reistijd en je netto uurloon.",
  },
};

const faqs = [
  ["Hoe vergelijk ik twee banen eerlijk?", "Kijk niet alleen naar het bruto salaris. Reken alles om naar wat je netto per maand overhoudt: salaris, vakantiegeld, 13e maand en bonus na belasting, plus of min je auto- of mobiliteitsregeling, en min de kosten die je maakt om op je werk te komen. Zet daarnaast de reistijd en zaken als pensioen en vakantiedagen op een rij."],
  ["Wat is het netto uurloon inclusief reistijd?", "Het bedrag dat je netto overhoudt, gedeeld door alle uren die je aan je baan kwijt bent: je contracturen plus je reistijd. Een baan met een hoger salaris maar een lange reis kan per uur van je tijd minder opleveren."],
  ["Hoe wordt een bonus of 13e maand belast?", "Een bonus of 13e maand valt bovenop je salaris en wordt dus belast tegen je hoogste tarief, inclusief de afbouw van heffingskortingen. Daarom rekenen we alle belastbare onderdelen samen uit in plaats van los."],
  ["Telt het pensioen van mijn werkgever mee?", "Niet in je netto bedrag, want je krijgt het nu niet uitbetaald. We tonen het wel apart als onderdeel van je totale beloning, omdat een hogere werkgeversbijdrage later meer pensioen oplevert."],
  ["Waarom rekent de leaseauto geen brandstof?", "Bij de meeste leaseauto's betaalt de werkgever brandstof of laden, onderhoud en verzekering. Je betaalt dan alleen belasting over de bijtelling en eventueel een eigen bijdrage. Bij een eigen auto rekenen we wel alle kosten, ook over je privé-kilometers."],
  ["Worden mijn gegevens opgeslagen?", "Alleen in je eigen browser, zodat je later verder kunt gaan. Er gaat niets naar een server. Met de knop om te delen maak je een link waarin de ingevulde bedragen staan; die link bevat geen naam of andere persoonsgegevens."],
] as const;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
};

export default function TotalPage() {
  return <main>
    <SiteNav active="total" />
    <header className="sub-hero shell">
      <span className="hero-kicker"><span className="kicker-line"></span> Het hele plaatje</span>
      <h1>Wat levert een nieuwe baan je écht op?</h1>
      <p>Vergelijk je huidige en nieuwe baan in één overzicht: salaris, bonus, pensioen, auto, reiskosten, reistijd en wat je per uur overhoudt.</p>
    </header>

    <TotalCalculator />

    <section className="how-section shell total-content">
      <div className="section-heading"><div><span className="section-kicker">Zo rekenen we</span><h2>Van bruto aanbod naar netto verschil</h2></div><span className="formula-mark">∑</span></div>
      <div className="how-grid">
        <div className="how-card"><span className="how-icon teal">01</span><h3>Alle inkomsten samen</h3><p>Salaris, vakantiegeld, 13e maand en bonus worden samen belast met de tarieven en heffingskortingen van 2026. Je eigen pensioeninleg gaat er vooraf af.</p></div>
        <div className="how-card"><span className="how-icon teal">02</span><h3>Auto en mobiliteit</h3><p>Bij een leaseauto betaal je belasting over de bijtelling. Een mobiliteitsbudget wordt belast na aftrek van de onbelaste km-vergoeding. Bij een eigen auto tellen vergoeding en alle autokosten mee.</p></div>
        <div className="how-card"><span className="how-icon blue">03</span><h3>Kosten van werken</h3><p>Uit je kantoordagen en werkweken volgen de kilometers, reistijd, parkeer- en lunchkosten per maand. Thuiswerkvergoeding en kinderopvang tellen per dag mee.</p></div>
        <div className="how-card"><span className="how-icon orange">04</span><h3>Tijd en extra&apos;s</h3><p>Reistijd telt mee in je netto uurloon. Pensioen van je werkgever, opleidingsbudget en vakantiedagen staan apart, omdat je ze niet als salaris ontvangt.</p></div>
      </div>
      <div className="disclaimer"><span className="disclaimer-icon">!</span><div><strong>Een indicatie, geen financieel advies.</strong><p>De uitkomst is een schatting op basis van je invoer en de tarieven van 2026. Toeslagen, persoonlijke aftrekposten, cao-regelingen en de exacte loonheffing per maand kunnen tot andere bedragen leiden. Lees meer in de <Link href="/uitleg">uitleg over de rekenmethode</Link>.</p></div></div>

      <div className="faq-block">
        <h2>Veelgestelde vragen</h2>
        <div className="faq-list">{faqs.map(([question, answer]) => <details className="faq-item" key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
      </div>
      <AdSenseSlot />
    </section>
    <SiteFooter />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
  </main>;
}
