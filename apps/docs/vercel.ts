import type { VercelConfig } from "@vercel/config/v1";

/**
 * Vercel settings for the docs (Root Directory: apps/docs). On Vercel the
 * build uses Blume's vercel() adapter (blume.config.ts), which writes
 * .vercel/output with every page under /docs, so the web app's /docs rewrite
 * reaches the same paths. Set SITE_URL to the main site's URL.
 */
export const config: VercelConfig = {
	framework: null,
	buildCommand: "pnpm run build",
};
