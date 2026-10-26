import type { Scope } from "@repo/auth";
import type { AnyDb } from "@repo/db";

/** Who is calling, and what they may do. Every door builds one. */
export type Caller = {
	userId: string;
	scopes: readonly Scope[];
	/** The door: the web app (session), the REST API (key), or MCP (OAuth or key). */
	via: "session" | "apiKey" | "oauth";
	/** The team the caller acts for; null for personal data. */
	organizationId: string | null; // turbinekit:orgs
};

/** Who owns what the caller makes, and who pays for it: their team, or them. */
export function ownerOf(caller: Caller): string {
	// #region turbinekit:orgs
	if (caller.organizationId) {
		return caller.organizationId;
	}
	// #endregion turbinekit:orgs
	return caller.userId;
}

export type OperationContext = {
	db: AnyDb;
	caller: Caller;
	requestId: string;
};
