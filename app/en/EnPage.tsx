import Link from "next/link";
import type { ReactNode } from "react";
import AdSlot from "../components/AdSlot";
import { SiteFooterEn, SiteNavEn, type NavKeyEn } from "../components/SiteChrome";
import { EN_AMOUNT_PAGES, enAmountLabel, enAmountPath } from "../../lib/en-amounts";
import { enArticlePath, getEnArticle } from "../../lib/en-articles";

export type Faq = readonly [question: string, answer: string];

/** English page frame for a calculator: hero, calculator, explanation, FAQ, guides, ad. Mirrors SpokePage. */
export default function EnPage({ active, kicker, title, intro, calculator, how, faqs, guides, adPlacement, extra, disclaimer }: {
  active?: NavKeyEn;
  kicker: string;
  title: string;
  intro: ReactNode;
  calculator: ReactNode;
  how: ReadonlyArray<readonly [title: string, text: string]>;
  faqs: readonly Faq[];
  /** Slugs of related English guides. */
  guides: readonly string[];
  adPlacement: string;
  extra?: ReactNode;
  disclaimer: ReactNode;
}) {
  const related = guides.map((slug) => getEnArticle(slug)).filter((article) => article !== undefined);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "en",
    mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
  };
  const colors = ["teal", "blue", "orange", "teal"];

  return <main>
    <SiteNavEn active={active} />
    <header className="sub-hero shell">
      <span className="hero-kicker"><span className="kicker-line"></span> {kicker}</span>
      <h1>{title}</h1>
      <p>{intro}</p>
    </header>

    {calculator}

    <section className="how-section shell total-content">
      <div className="section-heading"><div><span className="section-kicker">How we calculate</span><h2>Where does the result come from?</h2></div><span className="formula-mark">∑</span></div>
      <div className="how-grid">
        {how.map(([heading, text], index) => <div className="how-card" key={heading}><span className={`how-icon ${colors[index % colors.length]}`}>{String(index + 1).padStart(2, "0")}</span><h3>{heading}</h3><p>{text}</p></div>)}
      </div>
      <div className="disclaimer"><span className="disclaimer-icon">!</span><div><strong>An estimate, not financial advice.</strong>{disclaimer}</div></div>

      {extra}

      <div className="faq-block">
        <h2>Frequently asked questions</h2>
        <div className="faq-list">{faqs.map(([question, answer]) => <details className="faq-item" key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
      </div>

      {related.length > 0 && <div className="related-block">
        <h2>Guides</h2>
        <div className="related-list">{related.map((article) => <Link key={article.slug} href={enArticlePath(article)} className="related-card"><strong>{article.title}</strong><span>{article.description}</span></Link>)}</div>
        <Link className="related-all" href="/en/guides">All guides and salary examples →</Link>
      </div>}
    </section>
    <AdSlot placement={adPlacement} show="adsense" label="Advertisement" />
    <SiteFooterEn />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
  </main>;
}

/** Links to the English salary pages. */
export function SalaryLinks({ current, heading = "Net salary for common offers" }: { current?: string; heading?: string }) {
  const groups = [
    { title: "Per year", pages: EN_AMOUNT_PAGES.filter((page) => page.kind === "year") },
    { title: "Per month", pages: EN_AMOUNT_PAGES.filter((page) => page.kind === "month") },
  ];
  return <div className="amount-links">
    <h2>{heading}</h2>
    {groups.map((group) => <div key={group.title} className="amount-links-group">
      <span className="section-kicker">{group.title}</span>
      <div className="amount-links-grid">
        {group.pages.map((page) => page.slug === current
          ? <span key={page.slug} className="amount-link current" aria-current="page">{enAmountLabel(page)}</span>
          : <Link key={page.slug} className="amount-link" href={enAmountPath(page)}>{enAmountLabel(page)}</Link>)}
      </div>
    </div>)}
  </div>;
}
