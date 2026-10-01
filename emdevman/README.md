# Emmanuel Bitancor — Portfolio

A responsive personal portfolio built with Next.js, React, TypeScript and Tailwind CSS. It includes project filtering, accessible quick views, dedicated case-study routes, light/dark themes and reduced-motion support.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
npm run lint
npm run typecheck
npm run build:clean
```

`build:clean` deletes `.next`, rebuilds, and then runs the stylesheet check below. Use it for anything you intend to ship; plain `next build` reuses a warm cache and skips the check.

### The stylesheet checks

Two scripts, because a correct build and a correct deploy are separate things that fail independently.

`npm run verify:css` checks the local build: it compares the class names the prerendered pages use against the rules in the emitted CSS, and fails if a component's class has no rule. Run automatically by `build:clean`.

`npm run verify:deploy` checks the live site. It fetches the deployed page, reads every stylesheet the document links, and applies the same contract. Takes an optional URL, else `NEXT_PUBLIC_SITE_URL`, else the default in `app/lib/site.ts`:

```bash
npm run verify:deploy
npm run verify:deploy https://your-preview.vercel.app
```

Exit codes: `0` pass, `1` the site is up and the stylesheet is stale (a real defect), `2` the site could not be checked — network, DNS, non-200 (inconclusive). Keeping `2` separate matters: a check that reports failure when the network is down gets ignored, which is the fastest way to make a check worthless.

Run it after any deploy.

### Why they exist

That failure is otherwise silent. `lint`, `typecheck` and `next build` all pass when a component renders `class="gh-dot"` and the stylesheet has no `.gh-dot` rule — the element simply has no size and the section renders as an empty gap, with nothing warning. The GitHub calendar reached production in exactly that state: current HTML beside a stylesheet several builds old, still carrying the pre-redesign `.gh-cell` rules, and the calendar was invisible.

Both scripts assert the explicit list in `scripts/css-contract.mjs` rather than deriving one from the markup. The derived version reports ~234 false positives on a healthy build, because most class names are Tailwind utilities that never appear as literal selectors — they carry variants, arbitrary values, opacity modifiers and child selectors, and the v4 engine emits them under generated names.

When a section gains a class that carries real styling and is not also a Tailwind utility, add it to `CONTRACT` in `scripts/css-contract.mjs`. That is the entire maintenance cost, and both checks pick it up.

### Caching

`next.config.ts` splits the cache policy in two, and the split matters:

- `/_next/static/**` is content-hashed, so a cached copy can never be wrong. Those get `max-age=31536000, immutable`.
- Everything else gets `max-age=0, must-revalidate`. The document is what points at the current asset hashes, so a stale document is a stale pointer.

Project content is stored in `app/lib/data.ts`. The main page sections live in `app/sections`, shared UI in `app/components`, and global design tokens and responsive rules in `app/globals.css`.

## Contact form

The contact form posts to `/api/contact` and sends email through Resend. Copy `.env.example` to `.env.local` and set:

- `RESEND_API_KEY` — server-only Resend API key
- `CONTACT_TO_EMAIL` — inbox that receives portfolio inquiries
- `RESEND_FROM_EMAIL` — a verified Resend sender/domain

Keep `.env.local` out of version control. If the API is not configured, the form shows a helpful error and the direct email link remains available.

The profile card uses Open-Meteo for live weather without an API key. Configure the optional `NEXT_PUBLIC_WEATHER_*` variables in `.env.local` to change the displayed city, coordinates, and timezone.

## GitHub activity

The activity section reads from two independent sources, and they fail independently:

- **Repo stats** (repositories, stars, top language) come from `api.github.com`, which allows **60 requests an hour per IP** unauthenticated. Set an optional `GITHUB_TOKEN` in `.env.local` to raise that to 5000 an hour — it needs no scopes for public data, just a fine-grained token with public repository read. Without a token, a rate-limited response leaves those three stats as `—` and the badge reads "Repo stats rate-limited".
- **The contribution calendar** is scraped from the `github.com/users/<name>/contributions` HTML, which has no rate limit, so the calendar keeps working even when the stats do not.


The GitHub section uses cached public profile data and reads the public contribution-calendar page server-side so the custom heatmap matches GitHub's own daily contribution levels. It does not require GraphQL or a GitHub token. The response is cached for 15 minutes, and the section falls back to a direct profile link if GitHub's calendar markup is unavailable.

## Deployment

The app can be deployed to Vercel or any platform that supports Next.js 16. Set `NEXT_PUBLIC_SITE_URL` to the production origin so canonical and social metadata use the correct URL.
