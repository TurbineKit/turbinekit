# The web app: rendering, i18n, SEO, environment

## Rendering

- `cacheComponents` and `partialPrefetching` are on (`apps/web/next.config.ts`).
  A page is a static shell; parts that read the request stream in from
  `<Suspense>` boundaries.
- Read the request before `getAuth()` or `getDb()`. During the build,
  prerendering stops at the request read, so the build needs no secrets.
- `params` and `searchParams` are read inside `<Suspense>`: every link to a
  route shares one prefetched shell.
- `export const instant = false` opts a route out of the instant-navigation
  check. Use it only for pages reached from outside the app (an email link).
- Root params (`next/root-params`) give the locale to pages. Server actions
  and route handlers can't read them: pass the locale in.

## Languages

- `packages/i18n`: `locales`, `defaultLocale`, names. next-intl in
  `apps/web/src/i18n/`; `localePrefix: "as-needed"`: the default locale has
  bare URLs.
- `apps/web/messages/<locale>.json`: every string. `messages.test.ts`
  checks keys and ICU placeholders across locales.
- `Link`, `redirect`, `useRouter`, `getPathname` come from
  `@/i18n/navigation`.

## SEO and agents

- `createMetadata()` (`src/lib/metadata.ts`): title, description, canonical,
  hreflang with `x-default`, Open Graph and Twitter cards, the Markdown
  alternate.
- JSON-LD: `siteSchema`, `webPageSchema`, `breadcrumbSchema` with `<JsonLd>`.
- `src/lib/routes.ts` lists public pages; `sitemap.ts`, `robots.ts` and
  `llms.txt/route.ts` read it. `robots.txt` allows `/api/og` and blocks the
  rest of `/api/`, `/mcp` and the app.
- `/api/og?title=…&description=…`: share images (`next/og`).
- `scripts/build-markdown.ts` runs after `next build` and writes a `.md`
  copy of each public page (`/pricing.md`), for language models.

## Environment

- Each package validates its own variables on first use (`keys()` in
  `src/keys.ts`, t3-env). Empty strings count as unset.
- `apps/web/.env.local` serves the app, the database scripts and the auth
  CLI. `.env.example` lists everything.
- `SKIP_ENV_VALIDATION=1` skips validation (CI builds, tooling).

## Security headers

`next.config.ts` sends a baseline CSP (frame-ancestors, base-uri,
object-src, form-action), HSTS, `X-Content-Type-Options`, a referrer policy
and a permissions policy. A full script policy ships in report-only mode
until reports are clean (LAUNCH.md).
