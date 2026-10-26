import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { keys } from "./keys.ts";
import * as schema from "./schema/index.ts";

/**
 * A Drizzle client on postgres.js. `url` is the pooled connection string:
 * transaction-mode poolers don't support prepared statements, so they're
 * off. Idle connections close after 20 s, before a pooler drops them.
 */
export function createDb(url: string, options: { max?: number } = {}) {
	const sql = postgres(url, {
		prepare: false,
		max: options.max ?? 10,
		idle_timeout: 20,
		max_lifetime: 60 * 10,
		connect_timeout: 10,
		onnotice: () => {},
	});
	return drizzle(sql, { schema });
}

export type Db = ReturnType<typeof createDb>;

/** Any Drizzle Postgres handle: postgres.js, PGlite in tests, or a transaction. */
export type AnyDb = PgDatabase<PgQueryResultHKT, typeof schema>;

// Kept on globalThis so hot reloads in development reuse one pool.
const cache = globalThis as unknown as { __repoDb?: Db };

/** The app's database. Lazy: importing this module never needs a database. */
export function getDb(): Db {
	if (!cache.__repoDb) {
		const env = keys();
		cache.__repoDb = createDb(env.DATABASE_URL, { max: env.DATABASE_POOL_MAX });
	}
	return cache.__repoDb;
}
