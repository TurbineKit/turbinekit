"use server";

import {
	ALL_SCOPES,
	getAuth,
	permissionsFromScopes,
	revokeConnectedApp,
	type Scope,
} from "@repo/auth";
import { getDb } from "@repo/db";
import { headers } from "next/headers";
import { z } from "zod";
import { requireSession } from "@/lib/session";

const createKeyInput = z.object({
	name: z.string().trim().min(1).max(64),
	access: z.enum(["read", "readWrite"]),
});

/**
 * Creates an API key for the signed-in user and returns it: the only time
 * the full key is shown. Keys are created here only, never over HTTP.
 */
export async function createApiKey(input: z.input<typeof createKeyInput>) {
	const session = await requireSession();
	const { name, access } = createKeyInput.parse(input);
	// Read only: every `…:read` permission. Read and write: all of them.
	const scopes: Scope[] =
		access === "read"
			? ALL_SCOPES.filter((scope) => scope.endsWith(":read"))
			: ALL_SCOPES;
	const created = await getAuth().api.createApiKey({
		body: {
			name,
			userId: session.user.id,
			permissions: permissionsFromScopes(scopes),
			// #region turbinekit:orgs
			// Made in a team, the key acts for the team (teamOfKey in @repo/auth).
			...(session.session.activeOrganizationId && {
				metadata: { organizationId: session.session.activeOrganizationId },
			}),
			// #endregion turbinekit:orgs
		},
	});
	return { key: created.key };
}

export async function deleteApiKey(keyId: string) {
	await requireSession();
	await getAuth().api.deleteApiKey({
		body: { keyId: z.string().min(1).parse(keyId) },
		headers: await headers(),
	});
}

/** Removes a connected app's access to the account, at once. */
export async function revokeApp(clientId: string) {
	const { user } = await requireSession();
	await revokeConnectedApp(getDb(), user.id, z.string().min(1).parse(clientId));
}
