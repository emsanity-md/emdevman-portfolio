import type { MetadataRoute } from "next";

import { projects } from "@/app/lib/data";
import { siteUrl } from "@/app/lib/site";

/**
 * The sitemap, served at /sitemap.xml - the URL to hand to Search Console.
 *
 * The homepage plus one entry per case study. That includes the nine projects
 * flagged `isPrivate`, because nothing reads the flag: every one of those case
 * studies renders in full and ends in a request-access call to action rather
 * than a lock, so they are pages the site really serves and pages worth having
 * found. If they are ever meant to be closed off, that wants a `noindex` in
 * their metadata, not a quieter sitemap.
 *
 * The two state pages stay out: "this site is down for maintenance" and "this
 * project isn't public yet" are answers for a visitor who is already here, not
 * destinations to be ranked.
 *
 * `lastModified` is the build time, which is about as honest as a file generated
 * at build time can be. No `priority`, no `changeFrequency`: Google has said for
 * years that it ignores both, and a portfolio that changes when it changes has
 * no crawl schedule worth declaring.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: siteUrl, lastModified },
    ...projects.map((project) => ({
      url: `${siteUrl}/projects/${project.slug}`,
      lastModified,
    })),
  ];
}
