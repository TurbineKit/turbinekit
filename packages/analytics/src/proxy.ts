import { INGEST_PATH, posthogHosts } from "./config.ts";

/**
 * Request headers passed on to PostHog. All others stay here: above all
 * `Cookie` (the session) and `Authorization`, which are ours, not PostHog's.
 * A Next.js rewrite would forward them all, which is why this is a route.
 */
const FORWARDED_REQUEST_HEADERS = [
	"accept",
	"accept-encoding",
	"content-encoding",
	"content-type",
	"origin",
	"referer",
	"user-agent",
];

/**
 * Response headers passed back. Not `Content-Encoding` or `Content-Length`:
 * fetch has already decompressed the body. Not `Set-Cookie`: PostHog sets
 * nothing on this domain.
 */
const FORWARDED_RESPONSE_HEADERS = [
	"cache-control",
	"content-type",
	"etag",
	"expires",
	"last-modified",
];

/**
 * How long the CDN keeps PostHog's files, so each one doesn't cost a
 * function call. The scripts posthog-js loads carry their version in the
 * query; the project's remote config (`/array/…`) changes with its settings.
 */
const ASSET_CACHE = {
	static: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
	array: "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
} as const;

/**
 * `/ingest/static/x.js?v=1` goes to the assets host, every other path to
 * the ingestion host. The path keeps its trailing slash (`/e/`): PostHog's
 * endpoints expect it.
 */
export function upstreamRoute(
	requestUrl: string,
	ingestHost?: string,
): { url: URL; cache: string | null } | null {
	const url = new URL(requestUrl);
	if (
		url.pathname !== INGEST_PATH &&
		!url.pathname.startsWith(`${INGEST_PATH}/`)
	) {
		return null;
	}
	const path = url.pathname.slice(INGEST_PATH.length) || "/";
	const hosts = posthogHosts(ingestHost);
	const asset = path.startsWith("/static/")
		? "static"
		: path.startsWith("/array/")
			? "array"
			: null;
	return {
		url: new URL(`${path}${url.search}`, asset ? hosts.assets : hosts.ingest),
		cache: asset ? ASSET_CACHE[asset] : null,
	};
}

/** The allowed request headers, plus the visitor's IP for PostHog's GeoIP. */
export function upstreamRequestHeaders(incoming: Headers): Headers {
	const headers = new Headers();
	for (const name of FORWARDED_REQUEST_HEADERS) {
		const value = incoming.get(name);
		if (value !== null) headers.set(name, value);
	}
	const ip =
		incoming.get("x-real-ip")?.trim() ||
		incoming.get("x-forwarded-for")?.split(",")[0]?.trim();
	if (ip) headers.set("x-forwarded-for", ip);
	return headers;
}

/** The allowed response headers; a cacheable asset gets the CDN lifetime. */
export function downstreamResponseHeaders(
	upstream: Response,
	cache: string | null,
): Headers {
	const headers = new Headers();
	for (const name of FORWARDED_RESPONSE_HEADERS) {
		const value = upstream.headers.get(name);
		if (value !== null) headers.set(name, value);
	}
	if (!upstream.ok) headers.set("cache-control", "no-store");
	else if (cache) headers.set("cache-control", cache);
	return headers;
}

/**
 * The first-party proxy to PostHog (`/ingest/*`), so fewer blockers drop
 * events. Bodies stream through both ways; only the allowed headers cross.
 */
export async function proxyToPostHog(
	request: Request,
	ingestHost = process.env.NEXT_PUBLIC_POSTHOG_HOST,
	fetchImpl: typeof fetch = fetch,
): Promise<Response> {
	const route = upstreamRoute(request.url, ingestHost);
	if (!route) return new Response("Not found", { status: 404 });

	const hasBody = request.method !== "GET" && request.method !== "HEAD";
	let upstream: Response;
	try {
		upstream = await fetchImpl(route.url, {
			method: request.method,
			headers: upstreamRequestHeaders(request.headers),
			body: hasBody ? request.body : undefined,
			cache: "no-store",
			// fetch needs this to send a streamed body.
			...(hasBody && { duplex: "half" }),
		} as RequestInit);
	} catch {
		// PostHog is unreachable: answer at once. A thrown error would go to
		// onRequestError, which reports it to PostHog and waits for its retries.
		return new Response(null, {
			status: 502,
			headers: { "cache-control": "no-store" },
		});
	}

	return new Response(upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers: downstreamResponseHeaders(upstream, route.cache),
	});
}
