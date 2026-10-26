# The API: operations, REST, OpenAPI, MCP

## Operations

`defineOperation()` (`packages/api/src/operation.ts`) describes one action:
`id` (`resource.verb`), `method`, `path` (`/v1/projects/{id}`), `summary`,
`description`, `tags`, `scope`, `input` (one zod object: path params, query
and body together), `output`, optional `status` and `mcp`, and `run`, which
calls a service.

Everything is built from `operations` (`operations/index.ts`):

- **REST**: each route file in `apps/web/src/app/(api)/api/v1/` exports
  `route(operation)` per method. `routes.test.ts` checks that every
  operation has its line and every line its operation.
- **OpenAPI**: `/api/v1/openapi.json` (`openapi.ts`), OpenAPI 3.1 from the
  zod schemas (`z.toJSONSchema`). Each operation lists its permission as
  `x-required-permission`.
- **MCP**: operations with `mcp` become tools (`mcp.ts`). A caller only sees
  the tools its scopes allow.

## REST (`http.ts`)

- Credentials: `Authorization: Bearer tk_…` or `X-Api-Key: tk_…`. REST takes
  API keys only, never the session cookie.
- Bodies are JSON objects, at most 64 KB.
- Every response has a `Request-Id` (`req_…`) and `Cache-Control: no-store`.
- Errors: `{ "error": { "type", "code", "message", "param" } }`, like Stripe.
  `type` is one of `invalid_request_error`, `authentication_error`,
  `permission_error`, `not_found_error`, `rate_limit_error`, `api_error`.
  A 429 carries `Retry-After`.
- Lists: `{ data, nextCursor }`, newest first. `pagination.ts` has the
  helpers (`afterCursor`, `toPage`). The cursor is opaque: base64url of the
  last row's time and ID, exact because times keep milliseconds. `limit`
  defaults to 20, at most 100.

## Errors

Throw `ApiError` (`errors.ts`) from services: status, type, code, message,
and `param` for the input field at fault. `ApiError.notFound("project")` is
a 404.
Unknown errors become a 500 `api_error` and are logged with the request ID.

## The MCP server (`mcp.ts`, `apps/web/src/app/(mcp)/mcp/route.ts`)

- Streamable HTTP at `/mcp`, through `mcp-handler`. A browser that opens
  `/mcp` is sent to `/llms.txt`.
- Credentials: an API key, or an OAuth access token (a JWT the app signs,
  for the audience `<site>/mcp`). The token is checked against the local
  JWKS, then the user's consent, on every call: removing a connected app
  stops it at once.
- Without credentials: 401 with `WWW-Authenticate` pointing at
  `/.well-known/oauth-protected-resource/mcp`, which starts OAuth in the
  client (Claude, ChatGPT, Cursor…).
- Tool errors return the `ApiError` message, so the model can explain it.

## Rate limits

Each API key: 120 requests a minute (`API_RATE_LIMIT` in
`packages/auth/src/api-keys.ts`), counted by better-auth in Postgres.
