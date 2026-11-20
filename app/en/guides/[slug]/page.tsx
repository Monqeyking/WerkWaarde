import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "../../../components/AdSlot";
import { SiteFooterEn, SiteNavEn } from "../../../components/SiteChrome";
import { RichText, stripLinks } from "../../../vragen/RichText";
import { EN_ARTICLES, enArticlePath, getEnArticle } from "../../../../lib/en-articles";
import { OG_IMAGE, ORGANIZATION_ID, WEBSITE_ID, breadcrumbList, pageMetadata } from "../../../../lib/seo";
import { SITE_NAME, SITE_URL } from "../../../../lib/site";
import { DEFAULT_TAX_YEAR } from "../../../../lib/tax-years";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return EN_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getEnArticle((await params).slug);
  if (!article) return {};
  return pageMetadata({
    path: enArticlePath(article),
    lang: "en",
    title: article.seoTitle ?? article.title,
    description: article.description,
    socialTitle: article.title,
    article: { published: article.published ?? article.updated, modified: article.updated },
  });
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default async function GuidePage({ params }: Props) {
  const article = getEnArticle((await params).slug);
  if (!article) notFound();
  const related = article.related.map((slug) => getEnArticle(slug)).filter((item) => item !== undefined);
  const url = `${SITE_URL}${enArticlePath(article)}`;
  const organization = { "@type": "Organization", "@id": ORGANIZATION_ID, name: SITE_NAME, url: SITE_URL };
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": url, url, name: article.title, inLanguage: "en", isPartOf: { "@id": WEBSITE_ID } },
      {
        "@type": "Article",
        headline: article.title,
        description: article.description,
        image: `${SITE_URL}${OG_IMAGE.url}`,
        datePublished: article.published ?? article.updated,
        dateModified: article.updated,
        inLanguage: "en",
        mainEntityOfPage: { "@id": url },
        author: organization,
        publisher: organization,
      },
      breadcrumbList([["Guides", "/en/guides"], [article.title, enArticlePath(article)]], "en"),
    ],
  };

  return <main>
    <SiteNavEn active="guides" />
    <section className="legal-wrap shell article-wrap">
      <div className="sub-hero legal-hero">
        <Link className="legal-back" href="/en/guides">← All guides</Link>
        <h1>{article.title}</h1>
        <p className="article-meta">Updated on {dateFormat.format(new Date(article.updated))} · based on the {DEFAULT_TAX_YEAR} rules</p>
      </div>
      <article className="article-card">
        <p className="article-intro"><RichText text={article.intro} /></p>
        {article.sections.map((section) => <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph, index) => <p key={index}><RichText text={paragraph} /></p>)}
        </section>)}
        <div className="article-cta">
          <strong>Calculate it for your situation</strong>
          <Link className="primary-button" href={article.calculator.href}>{article.calculator.label} →</Link>
        </div>
      </article>
      {related.length > 0 && <div className="related-block article-related">
        <h2>Read also</h2>
        <div className="related-list">{related.map((item) => <Link key={item.slug} href={enArticlePath(item)} className="related-card"><strong>{item.title}</strong><span>{stripLinks(item.description)}</span></Link>)}</div>
      </div>}
    </section>
    <AdSlot placement={`en-guide-${article.slug}`} show="adsense" label="Advertisement" />
    <SiteFooterEn />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  </main>;
}
