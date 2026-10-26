import "./load-env.ts";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Migrations want a direct connection, not the pooler.
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
	throw new Error(
		"Set DATABASE_URL (or DATABASE_URL_UNPOOLED) in apps/web/.env.local first",
	);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });
try {
	await migrate(drizzle(sql), {
		migrationsFolder: new URL("../drizzle", import.meta.url).pathname,
	});
	console.info("Migrations applied");
} finally {
	await sql.end();
}
