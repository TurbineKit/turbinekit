import { defaultLocale, localeNames, locales } from "@repo/i18n";
import { site, siteUrl } from "@repo/site";
import { defineConfig } from "blume";
import { vercel } from "blume/deploy";
import { openapi } from "blume/reference";

/**
 * The API docs, served at <site>/docs: the web app rewrites /docs to this
 * deployment (DOCS_ORIGIN in apps/web/next.config.ts), so every page and
 * asset lives under the /docs base. openapi.json is written from
 * @repo/api before each dev, build and check (scripts/build-openapi.ts).
 *
 * Guides are MDX in docs/ (default locale) and docs/<locale>/; `pnpm
 * translate` writes missing translations with Claude. The API reference is
 * built from the operations' English descriptions.
 */

// Links, canonicals and the sitemap point at the main site. On Vercel the
// fallback (the project's own production URL) is the docs deployment.
if (
	process.env.VERCEL_ENV === "production" &&
	!process.env.SITE_URL &&
	!process.env.NEXT_PUBLIC_SITE_URL
) {
	throw new Error(
		"Set SITE_URL on the docs project to the main site's URL, for example https://example.com.",
	);
}

/**
 * On Vercel, the vercel() adapter keeps the pages static and puts the
 * redirects, the charset of the .md and .txt files and Accept: text/markdown
 * negotiation in the routing config. A Git-connected project ignores the
 * dist/vercel.json of a plain static build. Elsewhere, dist/ is a static
 * site for any host.
 */
const host = { base: "/docs", site: siteUrl() };

export default defineConfig({
	title: `${site.name} API`,
	description: `The REST API and MCP server of ${site.name}.`,
	content: { root: "docs" },
	theme: { accent: "#171717", radius: "md", mode: "system" },
	navigation: {
		tabs: [
			{ label: { en: "Guides", fr: "Guides" }, path: "/" },
			{
				label: { en: "API reference", fr: "Référence de l’API" },
				path: "/reference",
			},
		],
		actions: [{ href: siteUrl(), label: site.name }],
	},
	reference: [
		openapi({
			route: "/reference",
			spec: "./openapi.json",
			codeSamples: ["curl", "node", "python"],
		}),
	],
	i18n: {
		defaultLocale,
		locales: locales.map((code) => ({ code, label: localeNames[code] })),
	},
	agents: { llmsTxt: true, skillMd: true },
	seo: { sitemap: { alternates: true } },
	footer: {
		copyright: `© ${new Date().getFullYear()} ${site.company.name}`,
		links: [
			{
				label: { en: "Terms", fr: "Conditions" },
				href: `${siteUrl()}/legal/terms`,
			},
			{
				label: { en: "Privacy", fr: "Confidentialité" },
				href: `${siteUrl()}/legal/privacy`,
			},
		],
	},
	deployment: process.env.VERCEL ? vercel(host) : host,
});
