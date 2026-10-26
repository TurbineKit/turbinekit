"use client";

import { useEffect, useState } from "react";
import { authorizeResumeUrl, signedOAuthQuery } from "@/lib/oauth-query";

/**
 * Auth pages an MCP client's OAuth flow passes through (sign-in, sign-up,
 * two-factor) keep its signed query, so signing in continues to consent
 * instead of the dashboard.
 */

/** The page's whole query when it carries an OAuth flow, else ''. */
export function useOAuthSearch(): string {
	const [search, setSearch] = useState("");
	useEffect(() => {
		const { search: current } = window.location;
		setSearch(signedOAuthQuery(new URLSearchParams(current)) ? current : "");
	}, []);
	return search;
}

/** Adds the OAuth query to a link between auth pages. */
export function withOAuthSearch(path: string, oauthSearch: string): string {
	return oauthSearch ? `${path}${oauthSearch}` : path;
}

function inOAuthFlow(): boolean {
	return signedOAuthQuery(new URLSearchParams(window.location.search)) !== null;
}

/** Where an email link should land to continue the flow, or null outside one. */
export function oauthResumeUrl(): string | null {
	return authorizeResumeUrl(new URLSearchParams(window.location.search));
}

/**
 * In an OAuth flow, a sign-in answers with the next URL (consent, or back to
 * the client). better-auth's client follows `{ redirect: true, url }` itself;
 * navigating twice could send a one-time code twice. True when navigating.
 */
export function followOAuthRedirect(data: unknown): boolean {
	if (!inOAuthFlow()) {
		return false;
	}
	const { url, redirect } = (data ?? {}) as {
		url?: unknown;
		redirect?: unknown;
	};
	if (typeof url !== "string") {
		return false;
	}
	if (redirect !== true) {
		window.location.assign(url);
	}
	return true;
}
