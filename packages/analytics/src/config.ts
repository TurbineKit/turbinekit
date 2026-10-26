/** The path the browser sends events to; apps/web proxies it to PostHog (proxy.ts). */
export const INGEST_PATH = "/ingest";

/** posthog-js defaults snapshot. A later date turns on PostHog's newer defaults. */
export const POSTHOG_DEFAULTS = "2026-08-30";

/** PostHog Cloud US. Set NEXT_PUBLIC_POSTHOG_HOST to https://eu.i.posthog.com for EU Cloud. */
export const DEFAULT_INGEST_HOST = "https://us.i.posthog.com";

/**
 * The hosts that belong to one ingestion host: `https://eu.i.posthog.com`
 * has its assets on `eu-assets.i.posthog.com` and its app on
 * `eu.posthog.com`. A self-hosted or custom host serves all three.
 */
export function posthogHosts(ingestHost?: string) {
	const url = new URL(ingestHost || DEFAULT_INGEST_HOST);
	const region = url.hostname.match(/^(us|eu)\.i\.posthog\.com$/)?.[1];
	if (!region) {
		return { ingest: url.origin, assets: url.origin, ui: url.origin };
	}
	return {
		ingest: `https://${region}.i.posthog.com`,
		assets: `https://${region}-assets.i.posthog.com`,
		ui: `https://${region}.posthog.com`,
	};
}
