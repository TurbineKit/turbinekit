"use server";

import { getAuth } from "@repo/auth";
import { getDb, schema } from "@repo/db";
import { headers } from "next/headers";
import { z } from "zod";
import { requireAdmin, requireSession } from "@/lib/session";

const userId = z.string().min(1);

/** Every admin action leaves a row in the audit log. */
async function audit(
	actorId: string,
	action: string,
	targetId: string,
	details?: Record<string, unknown>,
) {
	await getDb()
		.insert(schema.auditLog)
		.values({ actorId, action, targetId, details });
}

/** Admins don't ban, demote or impersonate themselves. */
async function adminActingOn(id: string) {
	const { user } = await requireAdmin();
	const target = userId.parse(id);
	if (target === user.id) {
		throw new Error("Admins can't do this to their own account.");
	}
	return { adminId: user.id, target };
}

export async function banUserAction(input: { userId: string; reason: string }) {
	const { adminId, target } = await adminActingOn(input.userId);
	const reason = z.string().trim().max(500).parse(input.reason) || undefined;
	await getAuth().api.banUser({
		body: { userId: target, banReason: reason },
		headers: await headers(),
	});
	await audit(adminId, "user.banned", target, reason ? { reason } : undefined);
}

export async function unbanUserAction(id: string) {
	const { adminId, target } = await adminActingOn(id);
	await getAuth().api.unbanUser({
		body: { userId: target },
		headers: await headers(),
	});
	await audit(adminId, "user.unbanned", target);
}

export async function setRoleAction(input: {
	userId: string;
	role: "admin" | "user";
}) {
	const { adminId, target } = await adminActingOn(input.userId);
	const role = z.enum(["admin", "user"]).parse(input.role);
	await getAuth().api.setRole({
		body: { userId: target, role },
		headers: await headers(),
	});
	await audit(adminId, "user.role", target, { role });
}

/**
 * Signs the admin in as the user for an hour (impersonationSessionDuration
 * in packages/auth). The app shows a banner with the way back. The caller
 * then reloads the app: the whole session changed.
 */
export async function impersonateAction(id: string) {
	const { adminId, target } = await adminActingOn(id);
	await getAuth().api.impersonateUser({
		body: { userId: target },
		headers: await headers(),
	});
	await audit(adminId, "user.impersonated", target);
}

export async function stopImpersonatingAction() {
	await requireSession();
	await getAuth().api.stopImpersonating({ headers: await headers() });
}
