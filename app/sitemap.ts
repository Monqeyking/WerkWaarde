import { SITE_URL } from "../lib/site";
import type { MetadataRoute } from "next";
import { AMOUNT_PAGES, amountPath } from "../lib/amounts";
import { ARTICLES } from "../lib/articles";
import { CALCULATORS } from "../lib/calculators";
import { CAOS } from "../lib/caos";
import { caoPath } from "../lib/cao-pages";

export const dynamic = "force-static";

/**
 * Only articles and cao pages carry a lastmod: they have a real "updated" or "checked" date. A build date
 * on every URL tells Google nothing, so it would learn to ignore lastmod here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;
  const latestArticle = ARTICLES.map((article) => article.updated).sort().at(-1);
  const latestCaoCheck = CAOS.map((cao) => cao.checkedOn).sort().at(-1);
  const page = (path: string, lastModified?: string) => ({ url: `${baseUrl}${path}`, ...(lastModified && { lastModified }) });

  return [
    page("/"),
    ...CALCULATORS.map((tool) => page(tool.href)),
    ...AMOUNT_PAGES.map((amount) => page(amountPath(amount))),
    page("/cao", latestCaoCheck),
    ...CAOS.map((cao) => page(caoPath(cao), cao.checkedOn)),
    page("/vragen", latestArticle),
    ...ARTICLES.map((article) => page(`/vragen/${article.slug}`, article.updated)),
    ...["/uitleg", "/privacy", "/cookies", "/disclaimer", "/contact"].map((path) => page(path)),
  ];
}
