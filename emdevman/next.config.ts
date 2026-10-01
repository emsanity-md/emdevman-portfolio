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
*/
const DOCUMENT_SOURCE = "/:path((?!_next/static).*)";

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
