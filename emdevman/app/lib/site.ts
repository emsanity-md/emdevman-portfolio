/**
 * The share card, and the copy that goes with it.
 *
 * One image for every route, described once. A case study that names its own
 * `openGraph` replaces the layout's object outright rather than merging into it,
 * so the image has to be reachable from both - and the previous setup drifted
 * exactly this way, with the case studies inheriting a portrait that was never
 * meant to be a card.
 *
 * 1200x630 is the size every platform expects and 1.91:1 the ratio they crop to.
 * What this replaced was the avatar: 1024x1040, transparent and square, so each
 * preview cropped away half of it and was left with a face on an empty
 * background. Drawn by `scripts/generate-og-image.ps1` from the same tokens the
 * site uses, so the card and the page cannot fall out of step.
 *
 * The alt text describes what is actually in the image. A per-project card would
 * want its own, which is a `opengraph-image` file under `projects/[slug]/` -
 * that needs a rendering pipeline, and is not worth one for a second card.
 */

/**
 * The canonical origin, without a trailing slash so a path can be appended
 * directly. Read by the metadata, the sitemap and robots.txt, which all have to
 * agree on it: `metadataBase` resolves the relative image and canonical URLs,
 * and the sitemap needs absolute ones. Set NEXT_PUBLIC_SITE_URL to point a
 * preview deployment at itself instead of at production.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://emmanuelbitancor.vercel.app";

export const ogImage = {
  url: "/assets/images/og.png",
  width: 1200,
  height: 630,
  alt: "Emmanuel Bitancor, full-stack developer, beside his name and site address",
  type: "image/png",
} as const;

export const ogTitle = "Emmanuel Bitancor | Full-Stack Developer";

export const ogDescription =
  "Selected work and projects built with modern web technologies, with an emphasis on accessible and responsive experiences.";
