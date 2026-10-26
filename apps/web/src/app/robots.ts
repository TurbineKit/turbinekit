import { defaultLocale, locales } from "@repo/i18n";
import { siteUrl } from "@repo/site";
import type { MetadataRoute } from "next";
import { appPaths, authPaths } from "@/lib/routes";

/**
 * Public pages are open. The API, the MCP server and the pages behind
 * sign-in are not worth a crawl; those pages also say noindex themselves.
 * /api/og stays open: link previews fetch the share cards from there, and
 * some crawlers (X, for one) obey robots.txt.
 */
export default function robots(): MetadataRoute.Robots {
	const privatePaths = [...appPaths, ...authPaths];
	const prefixed = locales
		.filter((locale) => locale !== defaultLocale)
		.flatMap((locale) => privatePaths.map((path) => `/${locale}${path}`));

	return {
		rules: {
			userAgent: "*",
			allow: ["/", "/api/og"],
			disallow: ["/api/", "/mcp", ...privatePaths, ...prefixed],
		},
		sitemap: [
			`${siteUrl()}/sitemap.xml`,
			`${siteUrl()}/docs/sitemap.xml`, // turbinekit:docs
		],
	};
}
