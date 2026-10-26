import { type AnyDb, schema } from "@repo/db";
import { and, desc, eq, max } from "drizzle-orm";

const { oauthAccessToken, oauthClient, oauthConsent, oauthRefreshToken } =
	schema;

/** An MCP client (an AI assistant) a user allowed to act on their account. */
export type ConnectedApp = {
	clientId: string;
	name: string;
	/** The host of a URL client ID (CIMD): the identity the client proved. */
	host: string | null;
	scopes: string[];
	connectedAt: Date;
	lastUsedAt: Date | null;
};

function hostOf(clientId: string): string | null {
	try {
		return new URL(clientId).host;
	} catch {
		return null;
	}
}

/** The apps a user connected, newest first. "Last used" is the newest token. */
export async function listConnectedApps(
	db: AnyDb,
	userId: string,
): Promise<ConnectedApp[]> {
	const [rows, tokens] = await Promise.all([
		db
			.select({
				clientId: oauthConsent.clientId,
				name: oauthClient.name,
				scopes: oauthConsent.scopes,
				connectedAt: oauthConsent.createdAt,
			})
			.from(oauthConsent)
			.innerJoin(oauthClient, eq(oauthClient.clientId, oauthConsent.clientId))
			.where(eq(oauthConsent.userId, userId))
			.orderBy(desc(oauthConsent.createdAt)),
		db
			.select({
				clientId: oauthAccessToken.clientId,
				at: max(oauthAccessToken.createdAt),
			})
			.from(oauthAccessToken)
			.where(eq(oauthAccessToken.userId, userId))
			.groupBy(oauthAccessToken.clientId),
	]);
	const lastUse = new Map(tokens.map((row) => [row.clientId, row.at]));
	return rows.map((row) => ({
		clientId: row.clientId,
		name: row.name || hostOf(row.clientId) || row.clientId,
		host: hostOf(row.clientId),
		scopes: row.scopes,
		connectedAt: row.connectedAt,
		lastUsedAt: lastUse.get(row.clientId) ?? null,
	}));
}

/**
 * Removes one app's access: its consent and its tokens. The MCP server checks
 * the consent on every call, so access ends at once, even for unexpired
 * tokens. Returns whether the app was connected.
 */
export async function revokeConnectedApp(
	db: AnyDb,
	userId: string,
	clientId: string,
): Promise<boolean> {
	return await db.transaction(async (tx) => {
		await tx
			.delete(oauthAccessToken)
			.where(
				and(
					eq(oauthAccessToken.userId, userId),
					eq(oauthAccessToken.clientId, clientId),
				),
			);
		await tx
			.delete(oauthRefreshToken)
			.where(
				and(
					eq(oauthRefreshToken.userId, userId),
					eq(oauthRefreshToken.clientId, clientId),
				),
			);
		const removed = await tx
			.delete(oauthConsent)
			.where(
				and(
					eq(oauthConsent.userId, userId),
					eq(oauthConsent.clientId, clientId),
				),
			)
			.returning({ id: oauthConsent.id });
		return removed.length > 0;
	});
}

/** Removes every app's access, after a password reset. */
export async function revokeConnectedApps(
	db: AnyDb,
	userId: string,
): Promise<void> {
	await db.transaction(async (tx) => {
		await tx
			.delete(oauthAccessToken)
			.where(eq(oauthAccessToken.userId, userId));
		await tx
			.delete(oauthRefreshToken)
			.where(eq(oauthRefreshToken.userId, userId));
		await tx.delete(oauthConsent).where(eq(oauthConsent.userId, userId));
	});
}

/** Whether the user still allows this client: checked on every MCP call. */
export async function hasConsent(
	db: AnyDb,
	userId: string,
	clientId: string,
): Promise<boolean> {
	const [row] = await db
		.select({ id: oauthConsent.id })
		.from(oauthConsent)
		.where(
			and(eq(oauthConsent.userId, userId), eq(oauthConsent.clientId, clientId)),
		)
		.limit(1);
	return Boolean(row);
}
