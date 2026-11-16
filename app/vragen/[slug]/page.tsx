import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "../../components/AdSlot";
import { SiteFooter, SiteNav } from "../../components/SiteChrome";
import { ARTICLES, getArticle } from "../../../lib/articles";
import { SITE_NAME, SITE_URL } from "../../../lib/site";
import { RichText, stripLinks } from "../RichText";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getArticle((await params).slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/vragen/${article.slug}` },
    openGraph: { type: "article", locale: "nl_NL", siteName: SITE_NAME, title: article.title, description: article.description, modifiedTime: article.updated },
  };
}

const dateFormat = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric" });

export default async function ArticlePage({ params }: Props) {
  const article = getArticle((await params).slug);
  if (!article) notFound();
  const related = article.related.map((slug) => getArticle(slug)).filter((item) => item !== undefined);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: article.title,
        description: article.description,
        dateModified: article.updated,
        inLanguage: "nl-NL",
        mainEntityOfPage: `${SITE_URL}/vragen/${article.slug}`,
        publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Vragen", item: `${SITE_URL}/vragen` },
          { "@type": "ListItem", position: 2, name: article.title, item: `${SITE_URL}/vragen/${article.slug}` },
        ],
      },
    ],
  };

  return <main>
    <SiteNav active="questions" />
    <section className="legal-wrap shell article-wrap">
      <div className="sub-hero legal-hero">
        <Link className="legal-back" href="/vragen">← Alle vragen</Link>
        <h1>{article.title}</h1>
        <p className="article-meta">Bijgewerkt op {dateFormat.format(new Date(article.updated))} · indicatie op basis van de regels van 2026</p>
      </div>
      <article className="article-card">
        <p className="article-intro"><RichText text={article.intro} /></p>
        {article.sections.map((section) => <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph, index) => <p key={index}><RichText text={paragraph} /></p>)}
        </section>)}
        <div className="article-cta">
          <strong>Reken het uit voor jouw situatie</strong>
          <Link className="primary-button" href={article.calculator.href}>{article.calculator.label} →</Link>
        </div>
      </article>
      {related.length > 0 && <div className="related-block article-related">
        <h2>Lees ook</h2>
        <div className="related-list">{related.map((item) => <Link key={item.slug} href={`/vragen/${item.slug}`} className="related-card"><strong>{item.title}</strong><span>{stripLinks(item.description)}</span></Link>)}</div>
      </div>}
    </section>
    <AdSlot placement={`vragen-${article.slug}`} audience="candidate" />
    <SiteFooter />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  </main>;
}
