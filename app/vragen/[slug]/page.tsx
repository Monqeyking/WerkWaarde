import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "../../components/AdSlot";
import { SiteFooter, SiteNav } from "../../components/SiteChrome";
import { ARTICLES, getArticle } from "../../../lib/articles";
import { OG_IMAGE, ORGANIZATION_ID, WEBSITE_ID, breadcrumbList, pageMetadata } from "../../../lib/seo";
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
  return pageMetadata({
    path: `/vragen/${article.slug}`,
    title: article.seoTitle ?? article.title,
    description: article.description,
    socialTitle: article.title,
    article: { published: article.published ?? article.updated, modified: article.updated },
  });
}

const dateFormat = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric" });

export default async function ArticlePage({ params }: Props) {
  const article = getArticle((await params).slug);
  if (!article) notFound();
  const related = article.related.map((slug) => getArticle(slug)).filter((item) => item !== undefined);
  const url = `${SITE_URL}/vragen/${article.slug}`;
  const organization = { "@type": "Organization", "@id": ORGANIZATION_ID, name: SITE_NAME, url: SITE_URL };
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": url, url, name: article.title, inLanguage: "nl-NL", isPartOf: { "@id": WEBSITE_ID } },
      {
        "@type": "Article",
        headline: article.title,
        description: article.description,
        image: `${SITE_URL}${OG_IMAGE.url}`,
        datePublished: article.published ?? article.updated,
        dateModified: article.updated,
        inLanguage: "nl-NL",
        mainEntityOfPage: { "@id": url },
        author: organization,
        publisher: organization,
      },
      breadcrumbList([["Vragen", "/vragen"], [article.title, `/vragen/${article.slug}`]]),
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
    <AdSlot placement={`vragen-${article.slug}`} />
    <SiteFooter />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  </main>;
}
