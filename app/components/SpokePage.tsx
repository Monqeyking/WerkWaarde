import Link from "next/link";
import type { ReactNode } from "react";
import { getArticle } from "../../lib/articles";
import AdSlot from "./AdSlot";
import { SiteFooter, SiteNav, type NavKey } from "./SiteChrome";

export type Faq = readonly [question: string, answer: string];

/** Page frame for a single-topic calculator: hero, calculator, explanation, FAQ, related articles, ad. */
export default function SpokePage({ active, kicker, title, intro, calculator, how, faqs, articles, adPlacement }: {
  active?: NavKey;
  kicker: string;
  title: string;
  intro: string;
  calculator: ReactNode;
  how: ReadonlyArray<readonly [title: string, text: string]>;
  faqs: readonly Faq[];
  /** Slugs of related knowledge-base articles. */
  articles: readonly string[];
  adPlacement: string;
}) {
  const related = articles.map((slug) => getArticle(slug)).filter((article) => article !== undefined);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
  };
  const colors = ["teal", "blue", "orange", "teal"];

  return <main>
    <SiteNav active={active} />
    <header className="sub-hero shell">
      <span className="hero-kicker"><span className="kicker-line"></span> {kicker}</span>
      <h1>{title}</h1>
      <p>{intro}</p>
    </header>

    {calculator}

    <section className="how-section shell total-content">
      <div className="section-heading"><div><span className="section-kicker">Zo rekenen we</span><h2>Hoe komt de uitkomst tot stand?</h2></div><span className="formula-mark">∑</span></div>
      <div className="how-grid">
        {how.map(([heading, text], index) => <div className="how-card" key={heading}><span className={`how-icon ${colors[index % colors.length]}`}>{String(index + 1).padStart(2, "0")}</span><h3>{heading}</h3><p>{text}</p></div>)}
      </div>
      <div className="disclaimer"><span className="disclaimer-icon">!</span><div><strong>Een indicatie, geen financieel advies.</strong><p>De uitkomst is een schatting op basis van je invoer en de tarieven van 2026. Toeslagen, persoonlijke aftrekposten, cao-regelingen en de exacte loonheffing per maand kunnen tot andere bedragen leiden. Lees meer in de <Link href="/uitleg">uitleg over de rekenmethode</Link>.</p></div></div>

      <div className="faq-block">
        <h2>Veelgestelde vragen</h2>
        <div className="faq-list">{faqs.map(([question, answer]) => <details className="faq-item" key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
      </div>

      {related.length > 0 && <div className="related-block">
        <h2>Meer weten</h2>
        <div className="related-list">{related.map((article) => <Link key={article.slug} href={`/vragen/${article.slug}`} className="related-card"><strong>{article.title}</strong><span>{article.description}</span></Link>)}</div>
        <Link className="related-all" href="/vragen">Alle vragen en antwoorden →</Link>
      </div>}
    </section>
    <AdSlot placement={adPlacement} audience="candidate" />
    <SiteFooter />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
  </main>;
}
