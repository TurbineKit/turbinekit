import { verifyJwsAccessToken } from "@better-auth/core/oauth2";
import {
	API_KEY_PATTERN,
	getAuth,
	hasConsent,
	isBanned, // turbinekit:admin
	isScope,
	isTeamMember, // turbinekit:orgs
	type Scope,
	scopesFromPermissions,
	teamOfKey, // turbinekit:orgs
} from "@repo/auth";
import { mcpResource, oauthIssuer } from "@repo/auth/oauth";
import { getDb } from "@repo/db";
import type { Caller } from "./context.ts";
import { ApiError } from "./errors.ts";

/** The request's credential: `Authorization: Bearer …` or `X-Api-Key: …`. */
export function credentialOf(request: Request): string | null {
	const bearer = request.headers
		.get("authorization")
		?.match(/^Bearer\s+(\S+)$/i)?.[1];
	return bearer ?? request.headers.get("x-api-key")?.trim() ?? null;
}

export function isApiKey(credential: string): boolean {
	return API_KEY_PATTERN.test(credential);
}

/**
 * The caller behind an API key. Throws an ApiError: 401 for a bad key, 429
 * past the key's rate limit (better-auth's api-key plugin counts).
 */
export async function callerFromApiKey(key: string): Promise<Caller> {
	if (!isApiKey(key)) {
		throw new ApiError(
			401,
			"authentication_error",
			"invalid_api_key",
			"This API key is not valid.",
		);
	}
	const result = await getAuth().api.verifyApiKey({ body: { key } });
	if (!(result.valid && result.key)) {
		const limited =
			result.error?.code === "RATE_LIMITED" ||
			result.error?.code === "RATE_LIMIT_EXCEEDED";
		throw limited
			? new ApiError(
					429,
					"rate_limit_error",
					"rate_limited",
					"Too many requests with this API key. Wait a minute, then retry.",
				)
			: new ApiError(
					401,
					"authentication_error",
					"invalid_api_key",
					"This API key is not valid, or it was deleted.",
				);
	}
	await refuseBanned(result.key.referenceId); // turbinekit:admin
	// #region turbinekit:orgs
	// A key made in a team acts for the team while its owner belongs to it.
	const organizationId = teamOfKey(result.key.metadata);
	if (
		organizationId &&
		!(await isTeamMember(getDb(), result.key.referenceId, organizationId))
	) {
		throw new ApiError(
			403,
			"permission_error",
			"not_a_member",
			"This API key acts for a team you no longer belong to.",
		);
	}
	// #endregion turbinekit:orgs
	return {
		userId: result.key.referenceId,
		scopes: scopesFromPermissions(result.key.permissions),
		via: "apiKey",
		organizationId, // turbinekit:orgs
	};
}

// #region turbinekit:admin
/** A banned user's API keys and tokens stop working at once. */
async function refuseBanned(userId: string): Promise<void> {
	if (await isBanned(getDb(), userId)) {
		throw new ApiError(
			403,
			"permission_error",
			"account_banned",
			"This account is banned.",
		);
	}
}
// #endregion turbinekit:admin

/** The JWKS cache lives with this object (better-auth's own TTL rules). */
const jwksCacheKey = {};

/**
 * The caller behind an OAuth access token for the MCP server: signature
 * (our JWKS, read without a network call), issuer, audience (/mcp) and
 * expiry, then the user's consent, so removing a connected app works at
 * once. Null for any token that fails.
 */
export async function callerFromAccessToken(
	token: string,
): Promise<Caller | null> {
	let claims: Awaited<ReturnType<typeof verifyJwsAccessToken>>;
	try {
		claims = await verifyJwsAccessToken(token, {
			jwksFetch: () => getAuth().api.getJwks(),
			jwksCacheKey,
			verifyOptions: { issuer: oauthIssuer(), audience: mcpResource() },
		});
	} catch {
		return null;
	}
	// A sender-constrained (DPoP) token needs a proof this server doesn't check.
	if (claims.cnf) {
		return null;
	}
	const userId = typeof claims.sub === "string" ? claims.sub : null;
	const clientId =
		typeof claims.azp === "string"
			? claims.azp
			: typeof claims.client_id === "string"
				? claims.client_id
				: null;
	if (!(userId && clientId && (await hasConsent(getDb(), userId, clientId)))) {
		return null;
	}
	// #region turbinekit:admin
	if (await isBanned(getDb(), userId)) {
		return null;
	}
	// #endregion turbinekit:admin
	const scopes = (typeof claims.scope === "string" ? claims.scope : "")
		.split(" ")
		.filter(isScope) satisfies Scope[];
	return {
		userId,
		scopes,
		via: "oauth",
		organizationId: null, // turbinekit:orgs
	};
}
