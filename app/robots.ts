import { SITE_URL } from "../lib/site";
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;

  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${baseUrl}/sitemap.xml` };
}
