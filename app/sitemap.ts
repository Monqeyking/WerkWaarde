import { SITE_URL } from "../lib/site";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;
  const paths = ["/", "/totaal", "/mobiliteit", "/werkpatroon", "/uitleg", "/privacy", "/cookies", "/contact"];

  return paths.map((path) => ({ url: `${baseUrl}${path}`, lastModified: new Date() }));
}
