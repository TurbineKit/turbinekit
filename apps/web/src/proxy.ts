import { defaultLocale, isLocale } from "@repo/i18n";
import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { appPaths, isUnder } from "@/lib/routes";

const intl = createMiddleware(routing);

/**
 * 1. Signed-out visitors to the app (dashboard, account…) go to sign-in, with
 *    `next` set so they come back. It only checks that a session cookie
 *    exists: pages still check the session itself (lib/session.ts).
 * 2. Every page request goes to its language: `/fr/…` is French, a bare path
 *    the default locale, unless the cookie or browser asks for another one.
 */
export default function proxy(request: NextRequest) {
	const { pathname, search } = request.nextUrl;

	// #region turbinekit:analytics
	// next.config.ts turns off Next's trailing-slash redirect for PostHog's
	// paths, so pages get it here: each page has one URL.
	if (pathname.length > 1 && pathname.endsWith("/")) {
		// A plain URL: NextURL would put the slash back.
		const url = new URL(request.url);
		url.pathname = pathname.replace(/\/+$/, "");
		return NextResponse.redirect(url, 308);
	}
	// #endregion turbinekit:analytics

	const [, first = ""] = pathname.split("/");
	const locale = isLocale(first) ? first : null;
	const path = locale ? pathname.slice(locale.length + 1) || "/" : pathname;

	if (isUnder(path, appPaths) && !getSessionCookie(request)) {
		const prefix = locale && locale !== defaultLocale ? `/${locale}` : "";
		const url = new URL(`${prefix}/sign-in`, request.url);
		url.searchParams.set("next", `${pathname}${search}`);
		return NextResponse.redirect(url);
	}

	return intl(request);
}

export const config = {
	// Pages only: not the API, the MCP server, the docs, Next's own files, or
	// any path with a dot (robots.txt, llms.txt, .well-known, page.md copies).
	matcher: ["/((?!api|mcp|docs|ingest|_next|_vercel|.*\\..*).*)"],
};
