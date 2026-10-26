/**
 * Who the site is. create-turbinekit writes these values from your answers.
 * Everything that names the product reads them here: metadata, structured
 * data, emails, legal pages, llms.txt, auth and the MCP server.
 */
export const site = {
	/** A short, stable id: Stripe metadata, cookie and storage prefixes. */
	id: "turbinekit",
	name: "TurbineKit",
	description:
		"A lean, AI-first Next.js boilerplate built on free and open tools.",
	company: {
		name: "TurbineKit contributors",
		email: "hello@turbinekit.dev",
	},
	links: {
		github: "https://github.com/turbinekit/turbinekit",
	},
	/** Starts every API key, so people can tell your keys from others. */
	apiKeyPrefix: "tk_",
} as const;

/**
 * The site's origin, without a trailing slash: SITE_URL, then the Vercel
 * production URL, then localhost. Canonical URLs, sitemaps, share cards and
 * auth callbacks use it, so preview deployments still point at production.
 */
export function siteUrl(): string {
	const configured =
		process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();
	if (configured) {
		return configured.replace(/\/+$/, "");
	}
	const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
	if (production) {
		return `https://${production}`;
	}
	return "http://localhost:3000";
}
