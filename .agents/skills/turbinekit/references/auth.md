# Auth: sessions, API keys, OAuth for MCP, permissions

better-auth, configured in `packages/auth/src/server.ts` (`createAuth`);
`getAuth()` builds it on first use. The client is `createClient()` in
`packages/auth/src/client.ts`, wrapped by `apps/web/src/lib/auth-client.ts`.

## Sign-in

- Email and password, with a verified email required. A password reset
  revokes every session and every connected app.
- Google and GitHub, each on when both its keys are set.
- Passkeys and two-factor (TOTP, or a code by email).
- Sessions last 7 days and are checked in the database on every request
  (no cookie cache), so a revoked session or a ban applies at once.
- `apps/web/src/lib/session.ts`: `getSession()` and `requireSession()` read
  the request first, then the auth server. Use them inside `<Suspense>`.
- The proxy (`apps/web/src/proxy.ts`) only checks that a session cookie
  exists, to redirect quickly. Pages and actions do the real check.

## Permissions

`packages/auth/src/permissions.ts` has one list: `{ projects: ["read",
"write"] }`. API keys store them as permissions, OAuth tokens as scopes
(`projects:read`), and each operation declares the scope it needs. The
OAuth consent screen describes each scope with `Auth.consent.scope` in the
messages.

## API keys

- Created only by a server action (Account → API keys), never over HTTP:
  `disabledPaths` in `server.ts` blocks the HTTP endpoints.
- Prefix `tk_` (`site.apiKeyPrefix`), 48 letters; `API_KEY_PATTERN` rejects
  a malformed key before the database.
- Never a session: an API key can't sign in to the app.

## OAuth for MCP clients

- `@better-auth/mcp` and `@better-auth/oauth-provider`: dynamic client
  registration, and Client ID Metadata Documents (`cimd`) for clients that
  identify by URL, like Claude.
- Sign-in at `/sign-in`, consent at `/oauth/consent`. The signed OAuth query
  rides along through sign-in and two-factor (`apps/web/src/lib/oauth-query.ts`).
- Discovery: `/.well-known/oauth-protected-resource`,
  `/.well-known/oauth-authorization-server`, `/.well-known/openid-configuration`.
- Access tokens are JWTs for the audience `<site>/mcp` (`oauth.ts`).
- Account → Connected apps lists the clients and removes their access.

## Changing the auth tables

After you add or change a better-auth plugin, run `pnpm auth:generate`
(rewrites `packages/db/src/schema/auth.ts`), then `pnpm db:generate` and
`pnpm db:migrate`.
