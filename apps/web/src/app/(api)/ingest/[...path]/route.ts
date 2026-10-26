import { proxyToPostHog } from "@repo/analytics/proxy";

/**
 * PostHog's first-party proxy (/ingest/*): a route rather than a rewrite, so
 * that only allowed headers reach PostHog, never the session cookie.
 */
function proxy(request: Request) {
	return proxyToPostHog(request);
}

export const GET = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;
export const POST = proxy;
