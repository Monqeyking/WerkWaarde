import { SITE_URL } from "../lib/site";
import type { MetadataRoute } from "next";
import { AMOUNT_PAGES, amountPath } from "../lib/amounts";
import { ARTICLES } from "../lib/articles";
import { CALCULATORS } from "../lib/calculators";
import { CAOS } from "../lib/caos";
import { caoPath } from "../lib/cao-pages";
import { EN_AMOUNT_PAGES, enAmountPath } from "../lib/en-amounts";
import { EN_ARTICLES, enArticlePath } from "../lib/en-articles";
import { languageAlternates } from "../lib/hreflang";

export const dynamic = "force-static";

/**
 * Articles and cao pages carry their real "updated" or "checked" date here. After the build,
 * scripts/content-dates.mjs gives every URL a lastmod with the date its text last changed
 * (content-dates.json), using these dates for pages it sees for the first time. Never a
 * plain build date: that tells search engines nothing, so they would learn to ignore lastmod.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;
  const latestArticle = ARTICLES.map((article) => article.updated).sort().at(-1);
  const latestCaoCheck = CAOS.map((cao) => cao.checkedOn).sort().at(-1);
  const latestEnArticle = EN_ARTICLES.map((article) => article.updated).sort().at(-1);
  const page = (path: string, lastModified?: string) => {
    const languages = languageAlternates(path);
    return {
      url: `${baseUrl}${path}`,
      ...(lastModified && { lastModified }),
      ...(languages && { alternates: { languages: { nl: `${baseUrl}${languages.nl}`, en: `${baseUrl}${languages.en}`, "x-default": `${baseUrl}${languages["x-default"]}` } } }),
    };
  };

  return [
    page("/"),
    ...CALCULATORS.map((tool) => page(tool.href)),
    ...AMOUNT_PAGES.map((amount) => page(amountPath(amount))),
    page("/cao", latestCaoCheck),
    ...CAOS.map((cao) => page(caoPath(cao), cao.checkedOn)),
    page("/vragen", latestArticle),
    ...ARTICLES.map((article) => page(`/vragen/${article.slug}`, article.updated)),
    ...["/insluiten", "/over", "/uitleg", "/privacy", "/cookies", "/disclaimer", "/contact"].map((path) => page(path)),
    page("/en"),
    page("/en/30-percent-ruling"),
    ...EN_AMOUNT_PAGES.map((amount) => page(enAmountPath(amount))),
    page("/en/guides", latestEnArticle),
    ...EN_ARTICLES.map((article) => page(enArticlePath(article), article.updated)),
  ];
}
