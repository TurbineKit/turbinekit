"use client";

import { createClient } from "@repo/auth/client";
import { defaultLocale, isLocale } from "@repo/i18n";

/**
 * The two-factor page in the current page's language, keeping `next` (where
 * the user was headed) or the whole query of an MCP client's sign-in, which
 * the second factor then continues.
 */
function twoFactorUrl(): string {
	const { pathname, search } = window.location;
	const segment = pathname.split("/")[1];
	const locale = isLocale(segment) ? segment : defaultLocale;
	const path =
		locale === defaultLocale ? "/two-factor" : `/${locale}/two-factor`;
	return `${path}${search}`;
}

export const authClient = createClient({
	onTwoFactorRedirect() {
		window.location.href = twoFactorUrl();
	},
});

export const { signIn, signUp, signOut, useSession } = authClient;
