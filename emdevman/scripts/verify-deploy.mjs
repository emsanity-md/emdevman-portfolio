/**
 * Fails when the live site is serving markup and a stylesheet from different
 * builds.
 *
 * This is the check that would have caught the GitHub calendar arriving in
 * production as an empty gap. The deployed HTML referenced `gh-dot` on every day
 * cell; the deployed stylesheet had no `.gh-dot` rule at all and still carried
 * the pre-redesign `.gh-cell` ones. The section rendered as nothing, silently.
 *
 * A green local build does not prevent that. `verify-css.mjs` proves the build is
 * correct; this proves the *deployment* is. They failed independently here, which
 * is the whole reason both exist.
 *
 * Usage:
 *   node scripts/verify-deploy.mjs [url]
 *
 * The URL comes from the argument, else NEXT_PUBLIC_SITE_URL, else the same
 * default `app/lib/site.ts` falls back to.
 *
 * Exit codes, so CI can tell the two failures apart:
 *   0  the deployed stylesheet has every contracted rule
 *   1  the site is reachable and the stylesheet is stale  <- a real defect
 *   2  the site could not be checked (network, DNS, non-200) <- inconclusive
 *
 * The split matters. A deploy check that reports "FAILED" when the network is
 * down trains people to ignore it, which is the fastest way to make a check
 * worthless.
 */

import { CONTRACT_SIZE, formatMissing, hasRule, missingRules } from "./css-contract.mjs";

const DEFAULT_URL = "https://emmanuelbitancor.vercel.app";
const TIMEOUT_MS = 30_000;

function resolveUrl() {
  const arg = process.argv[2];
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  const raw = arg || fromEnv || DEFAULT_URL;
  // The env var carries a trailing slash in `.env.example`; normalise so it does
  // not produce a double slash before the asset paths.
  return raw.replace(/\/+$/, "");
}

/**
 * Fetch with a timeout.
 *
 * `AbortSignal.timeout` rather than a manual timer so the socket is torn down on
 * the abort path too - a hung request otherwise holds the process open past the
 * point where CI has already given up on it.
 */
async function get(url, accept) {
  const response = await fetch(url, {
    headers: { Accept: accept, "User-Agent": "verify-deploy" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }
  return response;
}

async function main() {
  const base = resolveUrl();
  console.log(`verify-deploy: checking ${base}`);

  let html;
  try {
    html = await (await get(base, "text/html")).text();
  } catch (error) {
    console.error(
      `verify-deploy: INCONCLUSIVE - could not fetch the site.\n  ${error.message}\n` +
        `This is a network or availability problem, not a stylesheet defect.`,
    );
    process.exit(2);
  }

  /*
    Every stylesheet the document actually links, not one. Next splits the CSS
    across chunks and which ones a page needs depends on its route; checking a
    single file would pass or fail by luck.
  */
  const stylesheets = [
    ...new Set(
      [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+\.css)"/g)].map(
        (m) => m[1],
      ),
    ),
  ];

  if (stylesheets.length === 0) {
    console.error(
      "verify-deploy: INCONCLUSIVE - the page links no stylesheet, so there is\n" +
        "nothing to check. That is not a pass.",
    );
    process.exit(2);
  }

  const bodies = [];
  for (const href of stylesheets) {
    const url = href.startsWith("http") ? href : `${base}${href}`;
    try {
      bodies.push(await (await get(url, "text/css")).text());
    } catch (error) {
      console.error(
        `verify-deploy: INCONCLUSIVE - a linked stylesheet could not be fetched.\n` +
          `  ${error.message}`,
      );
      process.exit(2);
    }
  }

  const css = bodies.join("\n");

  if (!hasRule(css, "section")) {
    console.error(
      "verify-deploy: INCONCLUSIVE - the linked CSS does not look like this site's\n" +
        "stylesheet (no `.section` rule). Refusing to report a list that would be noise.",
    );
    process.exit(2);
  }

  const missing = missingRules(css);

  /*
    The half of the diagnosis worth naming explicitly. A stale stylesheet is not
    just missing the new rules, it is carrying the old ones - so a contract class
    absent from CSS while its predecessor is present is the signature of a
    mismatched deploy rather than a component that was simply never styled.
  */
  if (missing.size > 0) {
    const ghost = stylesheets.length > 0 && /\.(gh-cell|theme-brightness-layer|theme-toggle-)/.test(css);
    console.error(
      `\nverify-deploy: FAILED - ${formatMissing(missing)}\n\n` +
        (ghost
          ? `The stylesheet still contains rules for components that no longer exist\n` +
            `(gh-cell, theme-toggle-*, theme-brightness-*). That is the signature of a\n` +
            `mismatched deploy: current HTML, older stylesheet.\n\n`
          : "") +
        `This is the failure mode that shipped an invisible calendar. Redeploy with a\n` +
        `clean build, and check that the HTML and the CSS come from the same deployment.\n`,
    );
    process.exit(1);
  }

  console.log(
    `verify-deploy: OK - ${CONTRACT_SIZE} contracted classes present across ` +
      `${stylesheets.length} stylesheet(s).`,
  );
}

main().catch((error) => {
  console.error("verify-deploy: crashed -", error);
  process.exit(2);
});
