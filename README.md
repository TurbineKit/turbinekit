# TurbineKit

A lean, AI-first Turborepo boilerplate for Next.js products, built only on
free and open tools.

```sh
pnpm create turbinekit my-app
```

The CLI asks for your product's name, languages and modules, then writes a
project with only what you picked: no dead code, no unused dependencies.

## What you get

- **Next.js 16** with Cache Components, React 19, Tailwind CSS 4 and
  shadcn/ui on Base UI. Static shells, streamed dynamic parts.
- **Auth** with better-auth: email and password with verification, Google
  and GitHub, passkeys, two-factor, API keys, and OAuth 2.1 for AI
  assistants.
- **One API, three doors.** Each operation is defined once and becomes a
  REST endpoint, an MCP tool, and an OpenAPI entry, backed by a service that
  your server actions call too.
- **An MCP server** at `/mcp`: Claude, ChatGPT and Cursor connect with OAuth
  and see only the tools the user approved.
- **Postgres and Drizzle**, with a lazy client and tests on PGlite (no
  database needed). `pnpm db:local` runs a Postgres-compatible server
  without Docker.
- **Languages** with next-intl: localized URLs, emails, legal pages and API
  docs. A test keeps every catalog in sync.
- **SEO built in**: metadata, hreflang, JSON-LD, a sitemap, robots.txt,
  share images, `llms.txt` and a Markdown copy of each page.
- **AI-first**: `AGENTS.md` with real house rules, `SETUP.md` that agents
  tick off, and skills for the common changes (add a page, an endpoint, a
  table, a language, an email…).
- **Builds without secrets**: every service is optional and off until its
  keys are set. CI builds with an empty environment.

## Modules

Pick any of them in the CLI. Each one comes out cleanly when you don't.

| Module         | What it adds                                                                       |
| -------------- | ---------------------------------------------------------------------------------- |
| Teams          | Organizations, email invitations, a team switcher, team projects and team API keys |
| Admin console  | Users, roles, bans, impersonation with a banner, an audit log                      |
| Payments       | Stripe Checkout and the customer portal, plans and limits, a pricing page          |
| File uploads   | Files SDK: local disk, S3-compatible stores or Vercel Blob                         |
| API docs       | Blume: guides and the API reference at `/docs`, with its own `llms.txt`            |
| Analytics      | PostHog: typed events, errors, flags, cookieless by default                        |
| Consent banner | c15t: opt-in in the EU, the UK and Quebec                                          |

Email goes through Resend or Email SDK (Resend, Postmark or SMTP); without a
provider, development emails land in a dev mailbox. Lint and format with
TurbineKit's Biome setup, or Ultracite.

## Next-forge, but lighter

TurbineKit is a spiritual successor to [next-forge](https://github.com/vercel/next-forge).

|                   | next-forge                                       | TurbineKit                                            |
| ----------------- | ------------------------------------------------ | ----------------------------------------------------- |
| Apps              | 7                                                | 1 app (+ docs)                                        |
| Built around      | Clerk, BaseHub, Liveblocks, Knock, Arcjet, Svix… | Free and open tools; paid services stay optional      |
| Database          | Prisma                                           | Drizzle, PGlite for tests and local work              |
| Auth              | Clerk                                            | better-auth, with OAuth for MCP clients               |
| API               | Separate app                                     | Operations: REST, MCP and OpenAPI from one definition |
| Choosing features | Delete by hand                                   | The CLI removes what you don't pick                   |

## Options

```sh
pnpm create turbinekit my-app --yes --modules orgs,admin --locales en,fr
```

Every question has a flag (`--help` lists them). `--yes` takes the
defaults, and `--json` prints a machine-readable result, for agents and CI.

## Working on TurbineKit

This repository is the template: with every module on, it runs as is.
`CONTRIBUTING.md` explains the markers that the CLI reads, and how to test
the generator.

## License

MIT
