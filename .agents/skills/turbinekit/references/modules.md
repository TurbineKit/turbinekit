# Modules

`create-turbinekit` asks which modules a project wants and removes the
others. `turbinekit.json` at the repository root records the answer:

```json
{
	"version": "0.1.0",
	"modules": ["files", "docs", "analytics", "consent", "orgs", "admin", "payments"],
	"providers": { "email": "resend", "files": "local" },
	"locales": ["en", "fr"],
	"lint": "biome"
}
```

| Module | Adds |
| --- | --- |
| `files` | `packages/storage` (Files SDK: local disk, S3-compatible, Vercel Blob), avatar upload, `/api/files/*`, `/api/uploads/avatar` |
| `docs` | `apps/docs` (Blume): guides and the API reference at `/docs`, its own `llms.txt` |
| `analytics` | `packages/analytics` (PostHog): typed events, page views, error tracking, server capture, flags, the `/ingest` proxy |
| `consent` | The c15t banner and preferences, by region; with analytics, PostHog follows the choice |
| `orgs` | Teams (better-auth organizations): the switcher, `/org`, email invitations, team projects and team API keys |
| `admin` | `/admin`: users, roles, bans (they stop API keys and tokens too), impersonation with a banner, the audit log, `pnpm admin:grant` |
| `payments` | `packages/billing` (Stripe): plans and limits, Checkout, the portal, the webhook, `/pricing`, Account → Billing, `pnpm stripe:setup` |

Providers: email is Resend or Email SDK (`resend`, `email-sdk`); files are
`local`, `s3` or `vercel-blob`.

## Markers

The TurbineKit template marks each module's code; the CLI uses the marks to
remove what a project doesn't use. A generated project has no marks left.

- Block: `// #region turbinekit:<id>` … `// #endregion turbinekit:<id>`.
  JSX and MDX: `{/* #region turbinekit:<id> */}`. Markdown: HTML comments.
  `.env` and YAML: `# #region turbinekit:<id>`.
- Line: a trailing `// turbinekit:<id>` (or `{/* … */}`, `<!-- … -->`).
- `a|b`: kept if either module is on. `a+b`: kept only if both are.
- `!turbinekit:<id>`: kept only when the module is off. The template has
  every module on, so this code is commented out there; the CLI uncomments
  it.

JSON can't hold comments: the CLI removes a module's dependencies, scripts,
`turbo.json` variables and message keys from its manifest
(`modules.json` in the `create-turbinekit` package).

## Bringing a module back

Use the `add-module` skill. It takes the module from the TurbineKit version
in `turbinekit.json`, so the code matches the rest of the project.
