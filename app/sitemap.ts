import { SITE_URL } from "../lib/site";
import type { MetadataRoute } from "next";
import { AMOUNT_PAGES, amountPath } from "../lib/amounts";
import { ARTICLES } from "../lib/articles";
import { CALCULATORS } from "../lib/calculators";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;
  const paths = [
    "/",
    ...CALCULATORS.map((tool) => tool.href),
    ...AMOUNT_PAGES.map(amountPath),
    "/vragen",
    ...ARTICLES.map((article) => `/vragen/${article.slug}`),
    "/uitleg", "/privacy", "/cookies", "/disclaimer", "/contact",
  ];

  return paths.map((path) => ({ url: `${baseUrl}${path}`, lastModified: new Date() }));
}
