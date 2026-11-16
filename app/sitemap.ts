import { SITE_URL } from "../lib/site";
import type { MetadataRoute } from "next";
import { ARTICLES } from "../lib/articles";
import { CALCULATORS } from "../lib/calculators";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;
  const paths = [
    "/",
    ...CALCULATORS.map((tool) => tool.href),
    "/vragen",
    ...ARTICLES.map((article) => `/vragen/${article.slug}`),
    "/uitleg", "/privacy", "/cookies", "/contact",
  ];

  return paths.map((path) => ({ url: `${baseUrl}${path}`, lastModified: new Date() }));
}
