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

  Two rules, and the split between them is the whole point.

  `/_next/static/**` is content-hashed: the filename changes whenever the bytes
  do, so a cached copy can never be wrong. Those get a year and `immutable`,
  which lets a browser skip revalidation entirely and is what keeps repeat
  visits cheap.

  Everything else - the HTML especially - must be revalidated. The document is
  what points at the current asset hashes, so a stale document is a stale pointer
  to assets that may no longer be the ones this build produced. `no-cache` still
  allows a cache to serve it, but only after a successful revalidation, so the
  worst case is one extra round trip rather than a page wired to yesterday's
  stylesheet.

  This is not hypothetical here: the GitHub calendar reached production as
  current HTML beside a stylesheet from a build several changes earlier, and the
  calendar rendered as an empty gap because the class names in the markup had no
  rules. `scripts/verify-css.mjs` catches that class of mismatch in the build;
  these headers keep a browser from being the thing that pins it in place.
*/
const staticAssetHeaders = [
  { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
];

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
      // Order matters: these are evaluated in sequence and the last match wins,
      // so the immutable rule has to come after the general one to take effect
      // for hashed assets.
      {
        source: "/:path*",
        headers: documentHeaders,
      },
      {
        source: "/_next/static/:path*",
        headers: staticAssetHeaders,
      },
    ];
  },
};

export default nextConfig;
