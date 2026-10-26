import { type AnyDb, schema } from "@repo/db";
import { and, eq } from "drizzle-orm";

const { member } = schema;

/**
 * The team an API key acts for: `metadata.organizationId`, set when the key
 * was made while a team was active (account actions). Null: personal.
 */
export function teamOfKey(metadata: unknown): string | null {
	let value = metadata;
	if (typeof value === "string") {
		try {
			value = JSON.parse(value);
		} catch {
			return null;
		}
	}
	const id = (value as { organizationId?: unknown } | null)?.organizationId;
	return typeof id === "string" && id ? id : null;
}

/** Whether the user belongs to the team now. */
export async function isTeamMember(
	db: AnyDb,
	userId: string,
	organizationId: string,
): Promise<boolean> {
	const rows = await db
		.select({ id: member.id })
		.from(member)
		.where(
			and(eq(member.userId, userId), eq(member.organizationId, organizationId)),
		)
		.limit(1);
	return rows.length > 0;
}
