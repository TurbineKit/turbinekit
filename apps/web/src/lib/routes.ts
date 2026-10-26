import type { MetadataRoute } from "next";

/** A public page's title and description live in the messages, under `Pages.<key>`. */
const PAGE_KEYS = [
	"home",
	"pricing", // turbinekit:payments
] as const;

type PageKey = (typeof PAGE_KEYS)[number];

type PublicPage = {
	key: PageKey;
	/** Path without the locale prefix. */
	path: string;
	changeFrequency: NonNullable<
		MetadataRoute.Sitemap[number]["changeFrequency"]
	>;
	priority: number;
};

/**
 * The public pages. The sitemap, llms.txt and the Markdown copies are built
 * from this list, so a new public page goes here (see the add-page skill).
 * Legal pages have their own list in lib/legal.ts.
 */
export const publicPages: readonly PublicPage[] = [
	{ key: "home", path: "/", changeFrequency: "weekly", priority: 1 },
	// #region turbinekit:payments
	{
		key: "pricing",
		path: "/pricing",
		changeFrequency: "monthly",
		priority: 0.8,
	},
	// #endregion turbinekit:payments
];

/**
 * Signed-in pages. They are noindex, robots.txt disallows them, and the proxy
 * sends signed-out visitors to the sign-in page.
 */
export const appPaths: readonly string[] = [
	"/dashboard",
	"/projects",
	"/account",
	"/org", // turbinekit:orgs
	"/admin", // turbinekit:admin
];

/** Sign-in and account recovery pages: noindex, disallowed in robots.txt. */
export const authPaths: readonly string[] = [
	"/sign-in",
	"/sign-up",
	"/forgot-password",
	"/reset-password",
	"/verify-email",
	"/two-factor",
	"/oauth",
];

/** True when `path` (without locale prefix) is `prefix` or below it. */
export function isUnder(path: string, prefixes: readonly string[]): boolean {
	return prefixes.some(
		(prefix) => path === prefix || path.startsWith(`${prefix}/`),
	);
}
