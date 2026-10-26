# AGENTS.md

This repository is a TurbineKit project: a Turborepo with a Next.js app (public
site, sign-in, signed-in app, REST API, MCP server) and its shared packages.
This file is the map and the house rules. Read it before you change code.

Recipes for common changes are skills in `.agents/skills/` (also linked from
`.claude/skills/`). Use the skill when one fits. Do not improvise a parallel
way.

## Map

- `apps/web`: the Next.js 16 app. See `apps/web/AGENTS.md` for its rules.
- `apps/docs`: the API docs (Blume), at `/docs` (`:4321` in development). <!-- turbinekit:docs -->
- `packages/api`: the API contract. Each operation (`defineOperation`) is a
  REST route, an MCP tool and an OpenAPI entry. Services hold the queries.
- `packages/auth`: better-auth (server and client), permissions, API keys,
  OAuth for MCP clients.
- `packages/db`: Drizzle schema, the lazy client (`getDb()`), migrations,
  PGlite for tests.
- `packages/email`: React Email templates, localized strings, transports.
  Without a provider, emails go to the dev mailbox (`/api/dev/mailbox`).
- `packages/i18n`: the locales. `packages/site`: the product's name, contact
  and URL (`siteUrl()`). `packages/ui`: shadcn/ui on Base UI, Tailwind tokens.
- `packages/storage`: files through Files SDK. <!-- turbinekit:files -->
- `packages/analytics`: PostHog events, flags and the `/ingest` proxy. <!-- turbinekit:analytics -->
- `packages/billing`: Stripe plans, limits, Checkout and webhooks. <!-- turbinekit:payments -->
- `SETUP.md`: how to run the project, service by service. `LAUNCH.md`: what
  to do before real users arrive. `turbinekit.json`: the TurbineKit version
  and modules of this project.

## Commands

Run them at the repository root.

| Command                      | What it does                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| `pnpm dev`                   | Every app; the site on http://localhost:3000                                                         |
| `pnpm db:local`              | A Postgres-compatible server (PGlite) on port 5432, no Docker                                        |
| `pnpm db:generate`           | A migration from the schema changes                                                                  |
| `pnpm db:migrate`            | Applies the migrations                                                                               |
| `pnpm lint` / `pnpm format`  | Biome: check / fix                                                                                   |
| `pnpm typecheck`             | TypeScript in every package                                                                          |
| `pnpm test`                  | Vitest in every package (PGlite, no database needed)                                                 |
| `pnpm build`                 | Every app. It needs no environment variables                                                         |
| `pnpm --filter web test:e2e` | Browser smoke tests: a migrated database, then `pnpm build` (or `E2E_BASE_URL` for a running server) |
| `pnpm auth:generate`         | Regenerates the auth tables after a better-auth plugin change                                        |
| `pnpm email:dev`             | Previews the email templates on :3001                                                                |

Before you say a change is done, run `pnpm lint`, `pnpm typecheck` and
`pnpm test`, and fix what they report.

## Rules

### Where code goes

- Queries on app tables live in `packages/api/src/services`. Server actions,
  REST routes and MCP tools all call the services; none of them query the
  database themselves. A service takes `(db, caller, input)`.
- A new API endpoint is an operation: skill `add-operation`. It gives the
  REST route, the MCP tool and the OpenAPI entry together.
- A new table: skill `add-table`. A new page: skill `add-page`.
- Packages export TypeScript source (`exports` → `./src/*.ts`). Inside
  packages, imports use the `.ts` extension.

### Rendering (Next.js Cache Components)

- Pages are static shells. Anything that reads the request (session,
  `headers()`, `cookies()`, `params`, `searchParams`) renders inside
  `<Suspense>`.
- Read the request before you call `getAuth()` or `getDb()` (for example
  `await headers()`, or `getSession()` from `apps/web/src/lib/session.ts`).
  Prerendering stops there, so the build never needs the environment.
- Server actions can't read the locale (it comes from root params). Pass it
  from the client when an action needs it.

### Data

- Change the schema in `packages/db/src/schema/`, run `pnpm db:generate`,
  commit the SQL, then `pnpm db:migrate`. Never edit an applied migration.
- IDs come from `createId("prefix")`: `prj_4fQ9…`. App tables pass their
  prefix in the schema; better-auth tables take theirs from `ID_PREFIXES`
  (`packages/db/src/id.ts`). Check that a new prefix is free:
  `grep -rn 'createId("' packages/db/src`.
- Times are `timestamp(…, { withTimezone: true, precision: 3 })`:
  milliseconds, like JavaScript dates, so list cursors stay exact.
- The auth tables (`schema/auth.ts`) are generated: `pnpm auth:generate`.

### Auth and permissions

- `requireSession()` (apps/web `lib/session.ts`) in pages and actions. The
  proxy only checks that a session cookie exists.
- Sessions are checked in the database on each request: a revoked session
  stops at once.
- One vocabulary of permissions (`packages/auth/src/permissions.ts`): API
  keys carry them, OAuth tokens carry them as scopes (`projects:read`), and
  each operation declares the one it needs.

### Text, languages and SEO

- Every string people read is in `apps/web/messages/<locale>.json`. A test
  checks that all locales have the same keys and placeholders.
- Links: import `Link` from `@/i18n/navigation`, never `next/link` (Biome
  refuses it).
- Public pages are listed in `apps/web/src/lib/routes.ts`. The sitemap,
  `llms.txt` and the Markdown copies of pages come from that list.

### Environment

- Each package reads its variables in its own `keys()` (`src/keys.ts`), on
  first use. A new variable goes there, in `.env.example` and in `SETUP.md`.
- A missing optional key turns its feature off. It never breaks the build.

### Style

- Biome: tabs, double quotes. `pnpm format` fixes most of it.
- Comments say why, in plain words. Keep them up to date when code changes.
- UI: components from `packages/ui` (`@repo/ui/components/…`). Add more with
  `pnpm dlx shadcn@latest add <name>` run in `apps/web`.

<!-- #region turbinekit:template -->

### Modules and markers

TurbineKit modules (`files`, `docs`, `analytics`, `consent`, `orgs` for teams,
`admin`, `payments`)
are marked in the code. `create-turbinekit` removes the ones a project
doesn't use; the skill `add-module` brings one back later.

- A block: `// #region turbinekit:<module>` … `// #endregion turbinekit:<module>`
  (`{/* … */}` in JSX and MDX, `<!-- … -->` in Markdown, `#` in env and YAML).
- One line: a trailing `// turbinekit:<module>`. Use it only on a line that
  stays one line after `pnpm format`. Otherwise use a block.
- `turbinekit:a|b`: kept if a or b is on. `turbinekit:a+b`: kept if both are.
- `!turbinekit:<module>`: kept only when the module is off. It is written
  commented out, because the full template has every module on.
- Languages other than English are marked the same way, by code:
  `turbinekit:fr`, `turbinekit:es`, `turbinekit:pt-BR`, `turbinekit:de`. A
  new one also goes into `LOCALES` (`tooling/create/src/options.ts`) and
  `MARKER_IDS` (`tooling/create/src/markers.ts`).

Keep the markers when you edit marked code, and put new code for a module
inside its markers.

<!-- #endregion turbinekit:template -->

### Troubleshooting

- The dev server reloads the page in a loop after a `next build` in
  `apps/web`: stop it, delete `apps/web/.next/dev`, start it again.
- New message keys show as raw keys (`Org.title`) in `pnpm dev`: restart it.
- "Invalid origin" at sign-in: `SITE_URL` must match the URL in the browser,
  port included.

## Skills

| To…                                                                                 | Use              |
| ----------------------------------------------------------------------------------- | ---------------- |
| Understand the architecture first, for a new resource or any change across packages | `turbinekit`     |
| Add a public or signed-in page                                                      | `add-page`       |
| Add an API endpoint (REST + MCP + OpenAPI)                                          | `add-operation`  |
| Add a database table                                                                | `add-table`      |
| Add a language                                                                      | `add-locale`     |
| Add an email                                                                        | `add-email`      |
| Add a legal page                                                                    | `add-legal-page` |
| Bring back a module the project doesn't have                                        | `add-module`     |
