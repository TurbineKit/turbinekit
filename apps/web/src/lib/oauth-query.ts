/**
 * An MCP client's OAuth flow sends the user to /sign-in and /oauth/consent
 * with the authorization request in the query, signed: `sig` covers the
 * parameters named by `ba_param`. These helpers read that query, and rebuild
 * the request when the user has to leave the page (email verification).
 */

/** Page search parameters as URLSearchParams, repeated keys kept. */
export function searchParamsFrom(
	record: Record<string, string | string[] | undefined>,
): URLSearchParams {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(record)) {
		for (const item of Array.isArray(value) ? value : [value]) {
			if (item !== undefined) {
				params.append(key, item);
			}
		}
	}
	return params;
}

/** The host of a URL, or null when it isn't one. */
export function hostOf(url: string | null | undefined): string | null {
	try {
		return url ? new URL(url).host : null;
	} catch {
		return null;
	}
}

/** The signed part of a query, or null when the page isn't part of an OAuth flow. */
export function signedOAuthQuery(search: URLSearchParams): string | null {
	const signed = new Set(search.getAll("ba_param"));
	if (!search.has("sig") || signed.size === 0) {
		return null;
	}
	const query = new URLSearchParams();
	for (const [key, value] of search) {
		if (key === "sig" || key === "ba_param" || signed.has(key)) {
			query.append(key, value);
		}
	}
	return query.toString();
}

/** The provider's own parameters, which a fresh authorize request must not carry. */
const PROVIDER_PARAMS = ["sig", "exp", "ba_param", "ba_iat", "ba_pl", "prompt"];

/**
 * The authorize URL that starts the same request again, for a user who
 * leaves to verify their email. Null outside an OAuth flow.
 */
export function authorizeResumeUrl(search: URLSearchParams): string | null {
	if (!signedOAuthQuery(search)) {
		return null;
	}
	const params = new URLSearchParams(search);
	for (const key of PROVIDER_PARAMS) {
		params.delete(key);
	}
	return `/api/auth/oauth2/authorize?${params}`;
}

/**
 * A same-site path to go to after signing in, or null. Refuses absolute
 * URLs and `//host` paths, so `next` can't send anyone to another site.
 */
export function safeNext(value: string | null | undefined): string | null {
	if (
		!value?.startsWith("/") ||
		value.startsWith("//") ||
		value.startsWith("/\\")
	) {
		return null;
	}
	return value;
}
