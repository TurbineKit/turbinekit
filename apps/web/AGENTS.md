# apps/web

The Next.js app. The root `AGENTS.md` has the house rules; this file covers
the app itself.

## Routes

- `src/app/[locale]/`: what people read, in their language. The default
  locale has no prefix (`/pricing`); the others have one (`/fr/pricing`).
  - `(core)/`: the public site.
  - `(legal)/legal/[slug]/`: legal pages from `content/legal/<slug>/<locale>.mdx`.
  - `(auth)/`: sign-in, sign-up, password reset, two-factor and the OAuth
    consent page. Not indexed.
  - `(app)/`: the signed-in app (dashboard, projects, account, team, admin).
    Not indexed; `robots.txt` disallows it; `src/proxy.ts` sends signed-out
    visitors to sign-in.
- `src/app/(api)/api/`: route handlers. `auth/[...all]` is better-auth;
  `v1/**` is the REST API, one file per path, each line from an operation
  (a test checks both directions); `og` makes share images.
- `src/app/(mcp)/mcp/route.ts`: the MCP server. `src/app/.well-known/`: OAuth
  discovery for MCP clients.
- `sitemap.ts`, `robots.ts`, `llms.txt/`, `manifest.ts`: built from
  `src/lib/routes.ts`.

## Pages

- Every page exports `generateMetadata`. Public pages use `createMetadata()`
  (`src/lib/metadata.ts`): canonical URL, hreflang, Open Graph.
- Server components by default. `"use client"` components live in
  `src/components/` and stay small.
- Data comes from a service, called with `sessionCaller(await requireSession())`.
- Forms call server actions in an `actions.ts` next to the page. An action
  returns `{ data }` or `{ error }` for expected refusals: in production,
  React hides the message of a thrown error.
- Use the components of `@repo/ui`. Colors come from the theme tokens
  (`bg-background`, `text-muted-foreground`…), so dark mode works.

## Messages

- `messages/en.json` is the source. Every locale has the same keys and
  placeholders; `pnpm test` checks.
- A namespace that only server components read goes in
  `SERVER_ONLY_NAMESPACES` (`src/lib/client-messages.ts`): pages then don't
  send it to the browser.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
