/**
 * Fails the build when the local stylesheet is older than the markup.
 *
 * Why this exists. That failure is otherwise completely silent: `lint`,
 * `typecheck` and `next build` all pass on a build where a component renders
 * `class="gh-dot"` and the emitted CSS has no `.gh-dot` rule. The element simply
 * has no size and the section renders as an empty gap. Nothing warns, and the
 * only way to notice is to compare the two artifacts - which nothing did.
 *
 * This is not hypothetical. v3's calendar reached production in exactly that
 * state: current HTML, and a stylesheet from a build three changes earlier,
 * still carrying the pre-redesign `.gh-cell` rules. Every check in `package.json`
 * was green.
 *
 * This checks the build. `verify-deploy.mjs` checks the deployment, which is a
 * separate thing that failed here: a green build is not proof of a correct
 * deploy. The list of classes both assert lives in `css-contract.mjs`.
 *
 * Run after `next build`. Reads build output only; changes nothing.
 */

import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import {
  CONTRACT_SIZE,
  formatMissing,
  hasRule,
  missingRules,
} from "./css-contract.mjs";

const ROOT = process.cwd();
const NEXT_DIR = path.join(ROOT, ".next");
const HTML_DIR = path.join(NEXT_DIR, "server", "app");
const CSS_DIRS = [
  path.join(NEXT_DIR, "static", "chunks"),
  path.join(NEXT_DIR, "static", "immutable", "chunks"),
];

/**
 * Recursively collect files. A missing directory yields an empty list rather than
 * an error: `.next/static/immutable` only exists on some Next versions, and the
 * caller reports the real problem with a clearer message than a stack trace.
 */
async function collect(dir, match) {
  if (!existsSync(dir)) return [];
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await collect(full, match)));
    else if (match.test(entry.name)) found.push(full);
  }
  return found;
}

async function main() {
  if (!existsSync(HTML_DIR)) {
    console.error("verify-css: no .next/server/app - run `next build` first.");
    process.exit(1);
  }

  const htmlFiles = await collect(HTML_DIR, /\.html$/);
  if (htmlFiles.length === 0) {
    console.error("verify-css: no prerendered HTML to check against.");
    process.exit(1);
  }

  const cssFiles = (await Promise.all(CSS_DIRS.map((d) => collect(d, /\.css$/)))).flat();
  if (cssFiles.length === 0) {
    console.error("verify-css: no emitted CSS found - the build produced no styles.");
    process.exit(1);
  }

  const css = (await Promise.all(cssFiles.map((f) => readFile(f, "utf8")))).join("\n");

  /*
    A sanity probe before reporting anything. If this is absent the file is not
    the stylesheet we think it is, and a list of 30 missing classes would be
    noise dressed up as a finding.
  */
  if (!hasRule(css, "section")) {
    console.error(
      "verify-css: the emitted CSS does not look like this project's stylesheet " +
        "(no `.section` rule). Refusing to report a list that would be noise.",
    );
    process.exit(1);
  }

  const missing = missingRules(css);

  console.log(
    `verify-css: checked ${CONTRACT_SIZE} component classes across ` +
      `${cssFiles.length} stylesheet(s) and ${htmlFiles.length} page(s).`,
  );

  if (missing.size > 0) {
    console.error(
      `\nverify-css: FAILED - ${formatMissing(missing)}\n\n` +
        `Almost always a stylesheet from an older build. Try:\n` +
        `  npm run build:clean\n`,
    );
    process.exit(1);
  }

  console.log("verify-css: OK - every contracted class has a rule.");
}

main().catch((error) => {
  console.error("verify-css: crashed -", error);
  process.exit(1);
});
