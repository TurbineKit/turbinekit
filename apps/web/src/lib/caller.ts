import type { Caller } from "@repo/api";
import { ALL_SCOPES, type Session } from "@repo/auth";

/**
 * The web app's caller: the signed-in user, with every scope (they act on
 * their own account), in their active team when they picked one.
 */
export function sessionCaller(session: Session): Caller {
	return {
		userId: session.user.id,
		scopes: ALL_SCOPES,
		via: "session",
		organizationId: session.session.activeOrganizationId ?? null, // turbinekit:orgs
	};
}
