import { SITE_URL } from "../lib/site";
import type { MetadataRoute } from "next";
import { AMOUNT_PAGES, amountPath } from "../lib/amounts";
import { ARTICLES } from "../lib/articles";
import { CALCULATORS } from "../lib/calculators";

export const dynamic = "force-static";

/**
 * Only articles carry a lastmod: they have a real "updated" date. A build date
 * on every URL tells Google nothing, so it would learn to ignore lastmod here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;
  const latestArticle = ARTICLES.map((article) => article.updated).sort().at(-1);
  const page = (path: string, lastModified?: string) => ({ url: `${baseUrl}${path}`, ...(lastModified && { lastModified }) });

  return [
    page("/"),
    ...CALCULATORS.map((tool) => page(tool.href)),
    ...AMOUNT_PAGES.map((amount) => page(amountPath(amount))),
    page("/vragen", latestArticle),
    ...ARTICLES.map((article) => page(`/vragen/${article.slug}`, article.updated)),
    ...["/uitleg", "/privacy", "/cookies", "/disclaimer", "/contact"].map((path) => page(path)),
  ];
}
