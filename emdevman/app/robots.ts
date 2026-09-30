import type { MetadataRoute } from "next";

import { siteUrl } from "@/app/lib/site";

/**
 * robots.txt, served at /robots.txt.
 *
 * There is nothing here to keep out of an index - the whole site is meant to be
 * found - so this file exists mostly to name the sitemap, which is how a crawler
 * discovers it without Search Console having to tell it.
 *
 * `/error/` is disallowed so a crawler does not file "this site is down for
 * maintenance" as the site's content; those are reached only from the
 * request-access links, and a crawler following one already has what it needs.
 * `/api/` answers requests rather than serving pages.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/error/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
