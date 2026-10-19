import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

/*
  Cache policy.

  One rule, on the document only.

  Hashed assets are deliberately NOT given a custom header. Next.js already sends
  `public, max-age=31536000, immutable` for `/_next/static/**` on its own, and
  overriding it is actively harmful: `next dev` serves un-hashed assets from that
  path, so an immutable header makes a browser hold a stale chunk through a
  rebuild and the dev server appears to be serving old code. Next.js warns about
  exactly this, and the warning is right. The default is already correct, so
  there is nothing to add.

  What is worth setting is the document. It is the thing that points at the
  current asset hashes, so a stale document is a stale pointer - and a stale
  pointer is how the GitHub calendar ended up in production as current HTML
  beside a stylesheet from a build several changes earlier, rendering as an empty
  gap because the class names in the markup had no rules.

  `max-age=0, must-revalidate` still lets a cache store the document; it only has
  to confirm it is current first. The worst case is one extra round trip, rather
  than a page wired to yesterday's stylesheet.

  `scripts/verify-css.mjs` catches that mismatch in the build and
  `scripts/verify-deploy.mjs` catches it in the deployment. This header stops a
  browser from being the thing that keeps it alive.
*/

/*
  The negative lookahead is load-bearing. A bare `/:path*` also matches
  `/_next/static/**`, and since these rules are applied in order with the last
  match winning, a catch-all here silently overwrites the immutable year that
  Next.js sets on hashed assets - every stylesheet and script revalidating on
  every load. Excluding the prefix hands those files back to the default, which
  is already correct.

  `/api/` is excluded for a different reason. A route handler sets its own
  `Cache-Control`, and this document rule was overwriting it - which is how
  `/api/ping` ended up answering with `public, max-age=0, must-revalidate`
  despite the route asking for `no-store`. A latency probe that a shared cache
  is allowed to keep is not measuring the network.
*/
const DOCUMENT_SOURCE = "/:path((?!_next/static|api/).*)";

const documentHeaders = [
  { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    qualities: [75, 85, 90, 100],

    /*
      The default `deviceSizes` ends at 3840, and that number ends up in the
      `srcset` of every image on the site. Browsers pick from `srcset` using
      `sizes`, so they were never actually fetching 3840 for a 352px portrait -
      but each entry is a full optimiser URL, and a single priority image was
      emitting a ~1.2kb preload link for nine candidates of which a phone uses
      one.

      Capped at the widest thing this site can lay out: the 1152px `max-w-6xl`
      container on a 2x display is 2304px, and 2048 covers that. The largest
      source on disk is a ~1900px project screenshot, so 2048 is also the point
      past which upscaling would be the only thing left to do.

      `imageSizes` is left at its default because it covers the small end -
      v1's 280px portrait and the 32-256px mark sets.
    */
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    /*
      AVIF first, WebP as the fallback.

      Order matters: the first entry the request's `Accept` header matches is
      the one served, so listing AVIF first is what makes it preferred where it
      exists rather than merely permitted.

      Next's own guidance is that WebP alone is usually the better trade - AVIF
      saves about 20% over WebP but takes roughly 50% longer to encode, which is
      paid on the first request for each distinct size and only amortised after.
      AVIF is kept here because the brief asks for it and the first-party
      portfolio images are the ones this actually applies to; if encode latency
      ever shows up in the TTFB on a cold cache, dropping "image/avif" from this
      list is the whole change.
    */
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: DOCUMENT_SOURCE,
        headers: documentHeaders,
      },
    ];
  },
};

export default nextConfig;
