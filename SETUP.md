# Setup

This guide takes the project from a fresh clone to a running app on
http://localhost:3000, in two passes:

1. **Minimal setup, about 10 minutes.** A database and one secret. The site,
   sign-up, the signed-in app, the REST API and the MCP server all work.
   Emails go to a dev mailbox instead of an inbox.
2. **Services.** Add the keys of each service you want. Each one is
   independent: without its keys, the feature is off and nothing breaks.

Tick the boxes as you go. Agents: tick a box when you finish its step, and
add a line under it if you had to do something different.

## Prerequisites

- **Node.js 24** (the version in `.nvmrc`).
- **pnpm 10**: run `corepack enable` once.
- **A database**, one of:
  - `pnpm db:local`: PGlite as a Postgres server. Nothing to install.
  - Docker: `docker compose up -d` (Postgres 18, `compose.yaml`).
  - Any Postgres 16 or later (PlanetScale, Neon, Supabase, a local install). Use its
    connection string.

## 1. Minimal setup

- [ ] Install, and create the local environment file:

  ```sh
  pnpm install
  cp .env.example apps/web/.env.local
  ```

  (`create-turbinekit` already did both, with a fresh secret.)

- [ ] Edit `apps/web/.env.local`:

  | Variable             | Value                                                                                                                 |
  | -------------------- | --------------------------------------------------------------------------------------------------------------------- |
  | `BETTER_AUTH_SECRET` | `openssl rand -base64 32`                                                                                             |
  | `SITE_URL`           | `http://localhost:3000`. It must match the URL in the browser, port included, or sign-in fails with "Invalid origin". |
  | `DATABASE_URL`       | Keep the default for `pnpm db:local` or Docker. Otherwise, your connection string.                                    |
  | `DATABASE_POOL_MAX`  | `1` with `pnpm db:local` (PGlite runs one query at a time). Empty otherwise.                                          |

- [ ] Start the database, create the tables, start the app:

  ```sh
  pnpm db:local        # or: docker compose up -d
  pnpm db:migrate      # in a second terminal
  pnpm dev
  ```

- [ ] Open http://localhost:3000 and create an account. The verification
  email is in the dev mailbox, http://localhost:3000/api/dev/mailbox: open
  its link. You land on the dashboard.

<!-- #region turbinekit:admin -->
- [ ] Make your account an admin (the `/admin` pages answer 404 otherwise):

  ```sh
  pnpm admin:grant you@example.com
  ```

  Sign out and in again. The same command works in production, with that
  environment's `DATABASE_URL`.
<!-- #endregion turbinekit:admin -->

- [ ] Check the API: create a key in **Account → API keys**, then

  ```sh
  curl http://localhost:3000/api/v1/projects -H "Authorization: Bearer tk_…"
  ```

## 2. Services

### Email

With `EMAIL_TRANSPORT=console`, or without a provider in development, each
email is printed in the terminal and kept in the dev mailbox (the last 50).
Production needs a provider, and a sending domain with SPF, DKIM and DMARC
records: without one, sending fails.

<!-- #region turbinekit:resend -->
- [ ] **Resend.** Create an API key at resend.com, and verify your sending
  domain there. Set `RESEND_API_KEY` and `EMAIL_FROM` (an address on that
  domain), and empty `EMAIL_TRANSPORT`: `console` always wins.
<!-- #endregion turbinekit:resend -->
<!-- #region turbinekit:email-sdk -->
- [ ] **Email SDK.** Set the keys of one or more providers: `RESEND_API_KEY`,
  `POSTMARK_SERVER_TOKEN`, or `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` and
  `SMTP_PASSWORD`. Email SDK tries them in that order. Set `EMAIL_FROM`, and
  empty `EMAIL_TRANSPORT`: `console` always wins.
<!-- #endregion turbinekit:email-sdk -->
- [ ] Preview the templates: `pnpm email:dev`, then http://localhost:3001.

### Google and GitHub sign-in

Each provider turns on when both of its keys are set.

- [ ] **Google**: Google Cloud console → APIs and services → Credentials →
  OAuth client ID (web application). Authorized redirect URI:
  `http://localhost:3000/api/auth/callback/google` (and your production
  URL). Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
- [ ] **GitHub**: Settings → Developer settings → OAuth Apps → New. Callback
  URL: `http://localhost:3000/api/auth/callback/github`. Set
  `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.

Passkeys and two-factor authentication need no setup.

<!-- #region turbinekit:files -->
### Files

By default (`STORAGE_DRIVER=local`), uploads go to `apps/web/.storage/` and
the app serves them. That works on a server with a disk, not on Vercel.

- [ ] **S3-compatible store** (Cloudflare R2, AWS S3, MinIO):
  `STORAGE_DRIVER=s3`, then `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`,
  `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY`. With a public bucket or a
  CDN, set `STORAGE_PUBLIC_URL` to its base URL.
- [ ] **Vercel Blob**: create a Blob store in the Vercel project, then
  `STORAGE_DRIVER=vercel-blob` and `BLOB_READ_WRITE_TOKEN`.
<!-- #endregion turbinekit:files -->

<!-- #region turbinekit:docs -->
### API docs

`pnpm dev` also starts the docs on http://localhost:4321/docs, and the app
serves them at http://localhost:3000/docs through `DOCS_ORIGIN`.

- [ ] Deploy `apps/docs` as its own Vercel project (Root Directory
  `apps/docs`) with `SITE_URL` set to the app's production URL. Then set
  `DOCS_ORIGIN` on the app to the docs project's URL.
- [ ] `pnpm --filter docs translate` writes missing translations with Claude.
<!-- #endregion turbinekit:docs -->

<!-- #region turbinekit:analytics -->
### Analytics (PostHog)

- [ ] Create a PostHog project (US or EU Cloud). Set
  `NEXT_PUBLIC_POSTHOG_KEY` (the project token, `phc_…`) and
  `NEXT_PUBLIC_POSTHOG_HOST` (`https://us.i.posthog.com` or
  `https://eu.i.posthog.com`).
- [ ] In the project settings, turn on **Cookieless server hash mode**.
  Visitors who haven't accepted cookies are counted without them; PostHog
  drops those events otherwise.
- [ ] Optional, error tracking with readable stack traces: a personal API
  key with error-tracking write access in `POSTHOG_API_KEY`, and the
  project ID in `POSTHOG_PROJECT_ID`. Builds then upload their source maps.

Events are typed in `packages/analytics/src/events.ts`.
<!-- #endregion turbinekit:analytics -->

<!-- #region turbinekit:consent -->
### Consent banner (c15t)

Nothing to set up. The rules are in `apps/web/c15t.config.ts`: opt-in in the
EU, the UK and Quebec, a notice with an opt-out in US privacy states, no
banner elsewhere. Locally, without location headers, everyone gets the EU
rule. "Cookie settings" in the footer reopens the choices.
<!-- #endregion turbinekit:consent -->

<!-- #region turbinekit:payments -->
### Payments (Stripe)

Use test mode until launch.

- [ ] Copy the test secret key into `STRIPE_SECRET_KEY`.
- [ ] Create the products and prices of `packages/billing/src/plans.ts`:

  ```sh
  pnpm stripe:setup
  ```

- [ ] Forward webhooks to the app, and set `STRIPE_WEBHOOK_SECRET` to the
  `whsec_…` it prints:

  ```sh
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  ```

- [ ] Turn on the customer portal: Stripe dashboard → Settings → Billing →
  Customer portal.
- [ ] Try it: **Account → Billing → Upgrade**, card `4242 4242 4242 4242`.
<!-- #endregion turbinekit:payments -->

### Cron

`/api/cron/cleanup` deletes expired sessions and verification tokens. On
Vercel, `apps/web/vercel.ts` runs it every day.

- [ ] Set `CRON_SECRET` (`openssl rand -base64 32`). Vercel sends it to the
  cron routes.

## 3. Deploy (Vercel)

- [ ] Create a Vercel project with Root Directory `apps/web`.
- [ ] Set the environment variables of section 1 and of each service, for
  Production and Preview. Use a separate database for previews.
- [ ] Run the migrations against the production database before the first
  deploy: `DATABASE_URL=… pnpm db:migrate`.
- [ ] Before real users arrive, go through `LAUNCH.md`.

Other hosts work too: `pnpm build`, then `pnpm --filter web start`. The core
uses no Vercel-only API.
