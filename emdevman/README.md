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
npm run build
```

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
