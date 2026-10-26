import { getAuth, type Session } from "@repo/auth";
import { defaultLocale } from "@repo/i18n";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { cache } from "react";
import { redirect } from "@/i18n/navigation";

/**
 * The current session, read once per request. It reads the request, so call
 * it inside a <Suspense> boundary (see AGENTS.md, "Rendering").
 */
export const getSession = cache(async (): Promise<Session | null> => {
	// Read the request first: during a build, this is where prerendering
	// stops, before anything builds the auth server or needs its environment.
	const requestHeaders = await headers();
	return getAuth().api.getSession({ headers: requestHeaders });
});

/**
 * The signed-in session, or a redirect to sign-in. The proxy already sends
 * signed-out visitors away; this is the real check.
 */
export async function requireSession(): Promise<Session> {
	const session = await getSession();
	if (!session) {
		// Server actions can't read the locale (it comes from root params).
		const locale = await getLocale().catch(() => defaultLocale);
		redirect({ href: "/sign-in", locale });
	}
	return session;
}

// #region turbinekit:admin
/** An admin's session (better-auth admin plugin role), or a 404. */
export async function requireAdmin(): Promise<Session> {
	const session = await requireSession();
	if (session.user.role !== "admin") {
		const { notFound } = await import("next/navigation");
		notFound();
	}
	return session;
}
// #endregion turbinekit:admin
