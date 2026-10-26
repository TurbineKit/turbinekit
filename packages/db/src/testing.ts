import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { createId } from "./id.ts";
import * as schema from "./schema/index.ts";

/**
 * An in-process Postgres (PGlite, WebAssembly) with every migration applied.
 * Tests run against the real SQL, constraints and cascades, with no server.
 * It is a single connection: tests of concurrent writes need a real
 * Postgres.
 */
export async function createTestDb() {
	const client = new PGlite();
	const db = drizzle(client, { schema });
	await migrate(db, {
		migrationsFolder: new URL("../drizzle", import.meta.url).pathname,
	});
	return { db, close: () => client.close() };
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>["db"];

/** A verified user, for tests that need an owner. */
export async function insertUser(
	db: TestDb,
	overrides: Partial<typeof schema.user.$inferInsert> = {},
) {
	const id = overrides.id ?? createId("usr");
	const [row] = await db
		.insert(schema.user)
		.values({
			id,
			name: id,
			email: `${id.toLowerCase()}@example.com`,
			emailVerified: true,
			...overrides,
		})
		.returning();
	if (!row) {
		throw new Error("insertUser: no row returned");
	}
	return row;
}
