import "@repo/db/load-env";
import { createDb, schema } from "@repo/db";
import { eq } from "drizzle-orm";

/**
 * `pnpm admin:grant <email>`: gives an existing user the `admin` role. They
 * must have signed up first, and sign in again for the role to apply.
 */
const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
	console.error("Usage: pnpm admin:grant <email>");
	process.exit(1);
}

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
	console.error("Set DATABASE_URL in apps/web/.env.local first.");
	process.exit(1);
}

const db = createDb(url, { max: 1 });
const updated = await db
	.update(schema.user)
	.set({ role: "admin" })
	.where(eq(schema.user.email, email))
	.returning({ id: schema.user.id });

if (updated.length === 0) {
	console.error(`No user with the email ${email}. Sign up first.`);
	process.exit(1);
}
console.info(`${email} is now an admin. Sign out and in again to use /admin.`);
process.exit(0);
