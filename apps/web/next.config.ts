import createMDX from "@next/mdx";
import { withPostHogConfig } from "@posthog/nextjs-config"; // turbinekit:analytics
import { withConsentManifest } from "c15t/next/build"; // turbinekit:consent
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Plugins are named as strings: Turbopack can't serialize plugin functions.
const withMDX = createMDX({ options: { remarkPlugins: ["remark-gfm"] } });

// #region turbinekit:docs
/**
 * The docs' own deployment (apps/docs, built by Blume with base /docs), for
 * example https://my-app-docs.vercel.app. Unset, /docs is not served.
 */
const docsOrigin = process.env.DOCS_ORIGIN?.trim().replace(/\/+$/, "");
// #endregion turbinekit:docs

/**
 * Sent with every response. The enforced CSP is a baseline that can't break a
 * script: nothing frames the app, no page sets <base> or embeds plugins, and
 * forms post to this origin. A full script policy ships in report-only mode;
 * promote it once reports are clean (see LAUNCH.md).
 */
const securityHeaders = [
	{
		key: "Content-Security-Policy",
		value:
			"frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
	},
	{
		key: "Content-Security-Policy-Report-Only",
		value:
			"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'",
	},
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{
		key: "Permissions-Policy",
		value:
			"camera=(), microphone=(), geolocation=(), usb=(), serial=(), hid=(), browsing-topics=()",
	},
	{ key: "Strict-Transport-Security", value: "max-age=63072000" },
];

const nextConfig: NextConfig = {
	// Static shells with dynamic parts in Suspense (see AGENTS.md, "Rendering").
	cacheComponents: true,
	// A <Link> prefetches the target route's static shell, shared by all links.
	partialPrefetching: true,
	// The workspace packages ship TypeScript source.
	transpilePackages: [
		"@repo/analytics", // turbinekit:analytics
		"@repo/api",
		"@repo/auth",
		"@repo/billing", // turbinekit:payments
		"@repo/db",
		"@repo/email",
		"@repo/i18n",
		"@repo/site",
		"@repo/storage", // turbinekit:files
		"@repo/ui",
	],
	pageExtensions: ["ts", "tsx", "md", "mdx"],
	// #region turbinekit:analytics
	// PostHog's endpoints end in a slash (/ingest/e/), which Next would
	// redirect away. Pages get the redirect from src/proxy.ts instead.
	skipTrailingSlashRedirect: true,
	// #endregion turbinekit:analytics
	experimental: {
		// app/global-not-found.tsx answers URLs that match no route.
		globalNotFound: true,
	},
	async headers() {
		return [
			{ source: "/:path*", headers: securityHeaders },
			{
				// Markdown copies of pages (scripts/build-markdown.ts).
				source: "/:path*.md",
				headers: [
					{ key: "Content-Type", value: "text/markdown; charset=utf-8" },
				],
			},
		];
	},
	async rewrites() {
		return {
			beforeFiles: [
				// #region turbinekit:docs
				...(docsOrigin
					? [
							{ source: "/docs", destination: `${docsOrigin}/docs` },
							{
								source: "/docs/:path*",
								destination: `${docsOrigin}/docs/:path*`,
							},
						]
					: []),
				// #endregion turbinekit:docs
			],
			afterFiles: [],
			fallback: [],
		};
	},
};

/** A Next.js config: an object, or an async function of the build phase. */
type Config =
	| NextConfig
	| ((
			phase: string,
			context: { defaultConfig: NextConfig },
	  ) => Promise<NextConfig>);

// #region turbinekit:analytics
/**
 * With a PostHog personal API key, a build uploads its source maps, so error
 * tracking shows the original code, then deletes them from the output.
 */
function withSourceMaps(config: Config): Config {
	const personalApiKey = process.env.POSTHOG_API_KEY;
	const projectId = process.env.POSTHOG_PROJECT_ID;
	if (!personalApiKey || !projectId) return config;
	return withPostHogConfig(config, {
		personalApiKey,
		projectId,
		host: (
			process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"
		).replace(".i.posthog.com", ".posthog.com"),
		sourcemaps: { enabled: true, deleteAfterUpload: true },
	});
}
// #endregion turbinekit:analytics

/** The modules' wrappers, in order: each wraps what the one before returned. */
const wrappers: Array<(config: Config) => Config> = [
	withConsentManifest, // turbinekit:consent
	withSourceMaps, // turbinekit:analytics
];

export default wrappers.reduce<Config>(
	(config, wrap) => wrap(config),
	withNextIntl(withMDX(nextConfig)),
);
