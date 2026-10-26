---
name: add-table
description: Add a database table to a TurbineKit project with Drizzle — the schema, its ID prefix, the migration and tests on PGlite. Use whenever the product needs to store a new kind of data.
---

# Add a table

App tables live in `packages/db/src/schema/`. `schema/app.ts` holds the
example `project` table: copy its shape.

## Steps

1. **Prefix.** Pick a 3-letter ID prefix and check no table uses it:

   ```sh
   grep -rn 'createId("' packages/db/src
   ```

   (better-auth's tables take theirs from `ID_PREFIXES` in
   `packages/db/src/id.ts`.)

2. **Schema.** Add the table to `packages/db/src/schema/app.ts`, or to a new
   file in that folder that `schema/index.ts` exports:

   ```ts
   export const note = pgTable(
   	"note",
   	{
   		id: text("id")
   			.primaryKey()
   			.$defaultFn(() => createId("not")),
   		body: text("body").notNull(),
   		ownerId: text("owner_id")
   			.notNull()
   			.references(() => user.id, { onDelete: "cascade" }),
   		createdAt: timestamp("created_at", { withTimezone: true, precision: 3 })
   			.notNull()
   			.defaultNow(),
   		updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 })
   			.notNull()
   			.defaultNow()
   			.$onUpdate(() => new Date()),
   	},
   	(table) => [index("note_owner_idx").on(table.ownerId)],
   );
   ```

   - Times: always `{ withTimezone: true, precision: 3 }`. Milliseconds
     match JavaScript dates, so list cursors stay exact.
   - Snake_case column names, camelCase properties.
   - Index every column you filter on.
   - If the project has teams (an `organization` table in `schema/auth.ts`),
     copy `organizationId` and its index from `project`, so rows can belong
     to a team.

3. **Migration.** It needs no database:

   ```sh
   pnpm db:generate --name=note    # writes packages/db/drizzle/NNNN_note.sql
   ```

   Read the SQL before you commit it. Never edit a migration that already
   ran somewhere: make a new one. Then, with the database running
   (`pnpm db:local` or `docker compose up -d`):

   ```sh
   pnpm db:migrate
   ```

4. **Services and operations.** Queries on the table go in a service in
   `packages/api/src/services/` (skill `add-operation`), never in pages or
   route handlers.

5. **Tests** go with the service, in `packages/api/src/api.test.ts`
   (`add-operation`, step 8). Test the table alone, in
   `packages/db/src/*.test.ts`, only for database behavior (a constraint, a
   cascade). `createTestDb()` from `@repo/db/testing` gives a fresh PGlite
   database with every migration applied, and `insertUser(db)` a user.

## Check

```sh
pnpm typecheck && pnpm test
pnpm db:generate    # must print "No schema changes"
```
