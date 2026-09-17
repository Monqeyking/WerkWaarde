import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://werk-waarde-khaki.vercel.app";
  const paths = ["/", "/uitleg", "/privacy", "/cookies", "/contact"];

  return paths.map((path) => ({ url: `${baseUrl}${path}`, lastModified: new Date() }));
}
