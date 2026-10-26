import { defaultLocale, localeNames, locales } from "@repo/i18n";
import { site } from "@repo/site";
import { getTranslations } from "next-intl/server";
import { legalSlugs } from "@/lib/legal";
import { absoluteUrl, markdownUrl, pageUrl } from "@/lib/metadata";
import { publicPages } from "@/lib/routes";

/**
 * /llms.txt (llmstxt.org): what the site is and where everything is, for
 * language models. Built from the route registry and the messages, so a new
 * page shows up without editing this file. Prerendered at build time.
 */
export async function GET() {
	const pages = await getTranslations({
		locale: defaultLocale,
		namespace: "Pages",
	});
	const legal = await getTranslations({
		locale: defaultLocale,
		namespace: "Legal",
	});
	const link = (title: string, url: string, note?: string) =>
		`- [${title}](${url})${note ? `: ${note}` : ""}`;
	const languages = locales
		.map((locale) =>
			locale === defaultLocale
				? `${localeNames[locale]} (default, no URL prefix)`
				: `${localeNames[locale]} (/${locale})`,
		)
		.join(", ");

	const lines = [
		`# ${site.name}`,
		"",
		`> ${site.description}`,
		"",
		`The site is available in ${languages}.`,
		"",
		`Every page below has a Markdown copy: add .md to its URL (index.md for a home page), for example ${markdownUrl("/")}.`,
		"",
		"## Pages",
		"",
		...publicPages.map((page) =>
			link(
				pages(`${page.key}.title`, { name: site.name }),
				pageUrl(page.path),
				pages(`${page.key}.description`),
			),
		),
		"",
		"## Developers",
		"",
		// #region turbinekit:docs
		`- [API documentation](${absoluteUrl("/docs")}), with its own [llms.txt](${absoluteUrl("/docs/llms.txt")})`,
		// #endregion turbinekit:docs
		link(
			"OpenAPI document",
			absoluteUrl("/api/v1/openapi.json"),
			"the REST API, authenticated with an API key",
		),
		link(
			"MCP server",
			absoluteUrl("/mcp"),
			"Streamable HTTP; sign in with OAuth or send an API key as a bearer token",
		),
		"",
		"## Optional",
		"",
		...legalSlugs.map((slug) =>
			link(legal(`${slug}.title`), pageUrl(`/legal/${slug}`)),
		),
		link("Sitemap", absoluteUrl("/sitemap.xml")),
		"",
	];

	return new Response(lines.join("\n"), {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
}
