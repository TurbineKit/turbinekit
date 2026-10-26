import type { VercelConfig } from "@vercel/config/v1";

/**
 * Vercel settings for the web app (Root Directory: apps/web). Crons run on
 * production deployments only; Vercel sends CRON_SECRET as a bearer token.
 */
export const config: VercelConfig = {
	framework: "nextjs",
	crons: [{ path: "/api/cron/cleanup", schedule: "0 4 * * *" }],
};
