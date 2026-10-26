import { type AnyDb, schema } from "@repo/db";
import { eq } from "drizzle-orm";

const { user } = schema;

/**
 * Whether an admin banned the user and the ban still runs. better-auth
 * signs a banned user out and refuses new sessions; API keys and OAuth
 * tokens need this check too (packages/api authenticate.ts).
 */
export async function isBanned(db: AnyDb, userId: string): Promise<boolean> {
	const [row] = await db
		.select({ banned: user.banned, banExpires: user.banExpires })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);
	if (!row?.banned) {
		return false;
	}
	return !(row.banExpires && row.banExpires.getTime() < Date.now());
}
