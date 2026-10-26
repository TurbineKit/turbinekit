# Launch checklist

What to do outside the code before real people use the product. Tick the
items in the pull request that does them. `SETUP.md` covers the setup of
each service; this list covers going live.

## Domain and hosting

- [ ] The production domain points at the app, with HTTPS. Redirect `www`
  to the apex (or the reverse) with a 308.
- [ ] `SITE_URL` is the production origin. Canonical URLs, the sitemap,
  share images, email links and OAuth callbacks all use it.
- [ ] Production and Preview have separate databases and separate secrets.
- [ ] The migrations ran on the production database
  (`DATABASE_URL=… pnpm db:migrate`). Make this a deploy step.
- [ ] Backups of the production database are on, and you restored one once.

## Accounts and security

- [ ] `BETTER_AUTH_SECRET` is random, long, and different in each
  environment. Changing it later signs everyone out.
- [ ] Google and GitHub OAuth apps list the production callback URLs
  (`/api/auth/callback/google`, `/api/auth/callback/github`).
- [ ] In production, try: sign-up, the verification email, sign-in, password
  reset, a passkey, two-factor, account deletion.
- [ ] Content Security Policy: the full policy ships in report-only mode
  (`apps/web/next.config.ts`). Browse the site with the developer tools
  open, fix what it reports, then move it to `Content-Security-Policy`.
- [ ] `Strict-Transport-Security`: once every subdomain serves HTTPS, add
  `includeSubDomains; preload` and submit the domain at hstspreload.org.
- [ ] `CRON_SECRET` is set, and the cleanup cron ran once (Vercel → Crons).

## Email

- [ ] The sending domain has SPF, DKIM and DMARC records, and the provider
  shows it as verified. Use a subdomain (`mail.example.com`), so the
  main domain's reputation stays apart.
- [ ] `EMAIL_FROM` uses that domain. `EMAIL_TRANSPORT` is empty.
- [ ] A test email reaches a Gmail and an Outlook inbox, not spam.

## Legal

- [ ] The legal pages (`apps/web/content/legal/`) name your company, your
  contact and your services. They are templates: have them reviewed.
- [ ] Each language has its own copy of each legal page
  (`<page>/<locale>.mdx`). These translations are templates too: have a
  lawyer review the text in each language you publish.
- [ ] The privacy policy names every processor that receives personal
  data: your host, your database and your email provider.
- [ ] It names PostHog too (analytics). <!-- turbinekit:analytics -->
- [ ] It names Stripe too (payments). <!-- turbinekit:payments -->
- [ ] The `updated` date of each page is the date of its text.

## Search engines and sharing

- [ ] Google Search Console and Bing Webmaster Tools: verify the domain and
  submit `/sitemap.xml`.
- [ ] `/robots.txt` allows the public pages and blocks `/api/` and the app.
- [ ] Share a page on a messaging app: the title, description and image
  (`/api/og`) show.
- [ ] `/llms.txt` lists the pages, and each page has a Markdown copy
  (`/pricing.md`) after a build.

<!-- #region turbinekit:analytics -->
## Analytics

- [ ] **Cookieless server hash mode** is on in the PostHog project, or the
  events of visitors who haven't accepted cookies are dropped.
- [ ] `POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` are set in Production, so
  errors show readable stack traces.
- [ ] A test visit shows up in PostHog, through `/ingest`.
<!-- #endregion turbinekit:analytics -->

<!-- #region turbinekit:consent -->
## Consent

- [ ] The rules in `apps/web/c15t.config.ts` match where you operate. The
  default asks first in the EU, the UK and Quebec.
- [ ] Your host passes location headers (Vercel does). Without them,
  everyone gets the EU rule.
- [ ] Choices stay in each browser: there is no record of them on a server.
  If you must prove consent (some EU regulators expect it), run a c15t
  backend (c15t.com/docs/self-host) and switch `offline()` to it.
<!-- #endregion turbinekit:consent -->

<!-- #region turbinekit:payments -->
## Payments

- [ ] Stripe account activated, business details and public details filled
  in (with the URLs of your terms and privacy policy).
- [ ] Live mode: `STRIPE_SECRET_KEY` (a restricted `rk_live_…` key is
  enough: write on Checkout Sessions, Customers, Billing Portal; read on
  Prices, Products, Subscriptions), then `pnpm stripe:setup` with it.
- [ ] Webhook endpoint `https://<your domain>/api/webhooks/stripe` with the
  events `checkout.session.completed` and `customer.subscription.*`. Its
  signing secret is the production `STRIPE_WEBHOOK_SECRET`.
- [ ] Customer portal on: cancellation at the end of the period, invoices
  visible.
- [ ] Taxes: decide with an accountant before you turn on Stripe Tax.
- [ ] Test end to end in test mode with a production build: subscribe,
  upgrade the limit, cancel in the portal, a failed payment
  (card `4000 0000 0000 0341`).
<!-- #endregion turbinekit:payments -->

<!-- #region turbinekit:files -->
## Files

- [ ] Production uses `s3` or `vercel-blob`: `local` loses files on every
  deploy of a serverless host.
- [ ] The bucket's public access and CORS match `STORAGE_PUBLIC_URL`.
<!-- #endregion turbinekit:files -->

## The API and the MCP server

<!-- #region turbinekit:docs -->
- [ ] The docs project is deployed, and `/docs` on the main domain shows it
  (`DOCS_ORIGIN`).
<!-- #endregion turbinekit:docs -->
- [ ] Connect the MCP server from Claude (Customize → Connectors → add a
  custom connector, `https://<your domain>/mcp`) and from Claude Code
  (`claude mcp add --transport http <name> https://<your domain>/mcp`).
  Sign in, approve, call a tool, then remove the app in
  **Account → Connected apps** and check that it stops at once.

### List the MCP server in directories

Do these in order: the MCP Registry has no review.

1. **Official MCP Registry.** Write a `server.json`:

   ```json
   {
   	"$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
   	"name": "com.example/app",
   	"title": "Your product",
   	"description": "What the tools do, in one sentence.",
   	"version": "1.0.0",
   	"websiteUrl": "https://example.com",
   	"remotes": [{ "type": "streamable-http", "url": "https://example.com/mcp" }]
   }
   ```

   The name starts with your domain reversed: the registry checks a DNS TXT
   record on it. Install `mcp-publisher`, make an Ed25519 key pair, add the
   TXT record it asks for (`v=MCPv1; k=ed25519; p=<public key>`), then
   `mcp-publisher login dns --domain example.com --private-key <hex>` and
   `mcp-publisher publish`. Keep the private key out of git.
2. **Claude Connectors Directory** (claude.ai/directory/manage → Submit new
   → MCP connector). It asks for the server URL, OAuth (Claude identifies
   itself with a Client ID Metadata Document: there is no client ID to
   enter), a test account without two-factor, your privacy policy, a
   support address, an icon, three example prompts and screenshots.
3. **ChatGPT apps** (platform.openai.com → Apps). It needs a verified
   business, a domain check, a demo video and a test account.

Before you submit anywhere: publish the legal pages, make a reviewer
account, and test every tool with a real account.

## After launch

- [ ] Uptime monitoring on `/` and `/api/v1/openapi.json`.
- [ ] Someone reads the error logs every day for the first week.
- [ ] Someone reads PostHog error tracking too. <!-- turbinekit:analytics -->
