---
name: turbinekit
description: How a TurbineKit project fits together — the request path from a page, a REST call or an MCP tool down to the database, auth and permissions, i18n and SEO, the optional modules and their markers. Load it before a change that touches several packages, or when you need to know where something belongs.
---

# TurbineKit

`AGENTS.md` at the repository root has the map, the commands and the house
rules. Read it first. This skill explains how the parts connect; the
references below go deeper, so load only the one you need.

## The three doors, one path

People and programs reach the same code through three doors:

```
browser page ─► server component / server action ─┐
REST client ─► /api/v1/** route(operation) ───────┼─► service(db, caller, input) ─► Postgres
AI assistant ─► /mcp tool (from the operation) ───┘
```

- **Operation** (`packages/api/src/operations/`): the contract. Input and
  output schemas (zod), the scope it needs, its REST path, its MCP tool.
- **Caller**: who acts, from a session (`sessionCaller`), an API key or an
  OAuth token. It carries the user, the scopes and the active team.
- **Service** (`packages/api/src/services/`): the only code that queries app
  tables. It scopes every query to the caller.

Errors are `ApiError`s with a stable `code`. REST returns them as
`{ error: { type, code, message, param } }`, MCP as a tool error, and
server actions as `{ error }`.

## References

| Read | When you work on |
| --- | --- |
| `references/api.md` | Operations, REST, OpenAPI, the MCP server, errors, pagination |
| `references/auth.md` | Sign-in, sessions, API keys, OAuth for MCP clients, permissions |
| `references/web.md` | Pages, rendering, i18n, SEO, the proxy, environment |
| `references/modules.md` | The optional modules, markers, `turbinekit.json` |

## Sources of truth

These beat any document, this one included:

- `packages/db/src/schema/`: the data model.
- `packages/auth/src/permissions.ts`: every permission.
- `packages/api/src/operations/index.ts`: every endpoint and tool.
- `apps/web/src/lib/routes.ts`: every public and signed-in path.
- `apps/web/messages/en.json`: every string people read.
