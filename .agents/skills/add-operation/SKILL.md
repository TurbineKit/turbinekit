---
name: add-operation
description: Add an API operation to a TurbineKit project. One operation is a REST endpoint, an MCP tool and an OpenAPI entry at once, backed by a service function that server actions reuse. Use for any new endpoint, tool, or action on a resource, including a whole new resource.
---

# Add an API operation

An operation (`defineOperation` in `packages/api`) is the single definition
behind a REST route, an MCP tool and an OpenAPI entry. The query lives in a
service function; server actions in the web app call the same function.

Read `packages/api/src/operations/projects.ts` and
`packages/api/src/services/projects.ts` first: they are the reference. Copy
their shape.

## Steps

1. **Table.** If the resource needs a new table, follow the `add-table` skill
   first, then come back.

2. **Permissions.** A new resource gets its own permissions in
   `packages/auth/src/permissions.ts`:

   ```ts
   export const PERMISSIONS = {
   	projects: ["read", "write"],
   	notes: ["read", "write"],
   } as const;
   ```

   - Add a line per new scope under `Auth.consent.scope` in every
     `apps/web/messages/<locale>.json`: the OAuth consent screen shows it.
   - Nothing else to change: API keys ("Read only" = every `…:read`
     permission, "Read and write" = all of them), OAuth scopes and the MCP
     server all read this list.

3. **Service**, `packages/api/src/services/<resource>.ts`: one exported
   function per action, `(db: AnyDb, caller: Caller, input) => Promise<…>`.
   - Scope every query to the caller. Copy `visibleTo(caller)` from
     `services/projects.ts`: with teams, a team's rows follow the active team.
   - Lists are newest first, a page at a time. Use `afterCursor` and
     `toPage` from `../pagination.ts`, exactly as `listProjects` does.
   - Return plain records with ISO date strings (`toRecord` in the
     reference).
   - A missing row: `throw ApiError.notFound("note")`. Other refusals:
     `new ApiError(status, type, code, message, param?)` (`../errors.ts`).
     Codes are snake_case and stable: clients branch on them.
   - If the project has the payments module and the plan should cap the
     resource, copy `assertRoomForProject` and add a limit to `PLANS` in
     `packages/billing/src/plans.ts`.

4. **Operations**, `packages/api/src/operations/<resource>.ts`. A list:

   ```ts
   export const listNotes = defineOperation({
   	id: "notes.list", // resource.verb
   	method: "GET",
   	path: "/v1/notes", // `/v1/notes/{id}` for one item
   	summary: "List notes",
   	description: "Returns the caller's notes, newest first, a page at a time.",
   	tags: ["Notes"],
   	scope: "notes:read",
   	input: z.object({
   		limit: z.coerce.number().int().min(1).max(100).default(20),
   		cursor: z.string().optional().describe("The `nextCursor` of the previous page."),
   	}),
   	output: z.object({ data: z.array(Note), nextCursor: z.string().nullable() }),
   	mcp: {
   		name: "list_notes",
   		title: "List notes",
   		description:
   			"Lists the user's notes, newest first, 20 at a time. When nextCursor is not null, call again with it as cursor.",
   		annotations: { readOnlyHint: true },
   	},
   	run: ({ db, caller }, input) => notes.listNotes(db, caller, input),
   });
   ```

   - `input` is one object: path params, query and body fields together.
     Query values arrive as strings: use `z.coerce` for numbers.
   - Validate field limits here, in zod (`z.string().trim().min(1).max(5000)`).
     Add a database constraint only for an invariant the data must never
     break.
   - `.describe()` the fields a client may misread: OpenAPI and the MCP tool
     show it.
   - `status: 201` on a create. A delete returns `{ id, deleted: true }`.
   - `mcp`: write the description for a model, not a person: when to call
     it and what comes back. Destructive tools get
     `annotations: { destructiveHint: true }`. Leave `mcp` out for an
     endpoint assistants shouldn't use.

5. **Register them** in `packages/api/src/operations/index.ts` (`operations`).

6. **Route files.** `apps/web/src/app/(api)/api/v1/<path>/route.ts`, one line
   per method. `{id}` in the path is a `[id]` folder:

   ```ts
   import { operations } from "@repo/api";
   import { route } from "@repo/api/http";

   export const GET = route(operations.listNotes);
   export const POST = route(operations.createNote);
   ```

   `api/v1/routes.test.ts` fails until each operation has its line and each
   line has its operation.

7. **Server actions**, if the web app needs the resource: an `actions.ts`
   next to the page calls the service with `sessionCaller(await
   requireSession())`, and returns `{ data }` or `{ error }` (see
   `app/[locale]/(app)/projects/actions.ts`).

8. **Tests**, in `packages/api/src/api.test.ts`. The shared keys
   (`writeKey`, `readKey`, `otherKey`) already carry every permission, new
   ones included. Add the resource's fields to the `Body` type at the top.
   Then a `describe` block like `REST`:
   - create, read, update, delete, and a page of a list;
   - a refusal: a write with `readKey` gets 403 `insufficient_scope`;
   - another user's rows stay hidden (`otherKey`);
   - if the project has teams, a team key sees the team's rows (copy the
     `Teams` block);
   - the MCP tool list for a read key and a write key (copy the `MCP` block).

9. **Docs**, in `apps/docs/docs/` and each translation in
   `apps/docs/docs/<locale>/`: add the tools to the table in `mcp.mdx`, and
   a sentence about the resource in `index.mdx` if it is new. The API
   reference updates itself from the operations.

## Check

```sh
pnpm typecheck && pnpm test && pnpm lint
pnpm --filter docs spec    # with apps/docs: writes openapi.json; check it lists them
```

With a database and `pnpm dev` running, and an API key:

```sh
curl localhost:3000/api/v1/notes -H "Authorization: Bearer <key>"
```
