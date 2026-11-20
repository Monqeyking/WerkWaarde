import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "../../components/AdSlot";
import JsonLd from "../../components/JsonLd";
import { SiteFooterEn, SiteNavEn } from "../../components/SiteChrome";
import { SalaryLinks } from "../EnPage";
import { EN_ARTICLES, enArticlePath } from "../../../lib/en-articles";
import { breadcrumbJsonLd, pageMetadata } from "../../../lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/en/guides",
  lang: "en",
  title: "Guides for expats: Dutch salary and tax",
  description: "Plain-English guides to working in the Netherlands: the 30% ruling, your Dutch payslip, income tax rates and tax credits, and net salaries for common offers.",
});

export default function GuidesPage() {
  return <main>
    <JsonLd data={breadcrumbJsonLd([["Guides", "/en/guides"]], "en")} />
    <SiteNavEn active="guides" />
    <header className="sub-hero shell">
      <span className="hero-kicker"><span className="kicker-line"></span> Guides</span>
      <h1>Dutch salary and tax, explained in English</h1>
      <p>Short guides for people who work in the Netherlands, with the official figures of this tax year. Each one links to a calculator, so you can see what it means for your own salary.</p>
    </header>
    <section className="how-section shell total-content">
      <div className="related-block">
        <h2>Guides</h2>
        <div className="related-list">{EN_ARTICLES.map((article) => <Link key={article.slug} href={enArticlePath(article)} className="related-card"><strong>{article.title}</strong><span>{article.description}</span></Link>)}</div>
      </div>
      <SalaryLinks />
    </section>
    <AdSlot placement="en-guides" show="adsense" label="Advertisement" />
    <SiteFooterEn />
  </main>;
}
