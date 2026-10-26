import { describe, expect, it } from "vitest";
import { posthogHosts } from "./config.ts";
import {
	downstreamResponseHeaders,
	proxyToPostHog,
	upstreamRequestHeaders,
	upstreamRoute,
} from "./proxy.ts";
import { captureException, isFeatureEnabled, track } from "./server.ts";

describe("posthogHosts", () => {
	it("derives the assets and app hosts of PostHog Cloud", () => {
		expect(posthogHosts("https://eu.i.posthog.com")).toEqual({
			ingest: "https://eu.i.posthog.com",
			assets: "https://eu-assets.i.posthog.com",
			ui: "https://eu.posthog.com",
		});
	});

	it("defaults to US Cloud, also for an empty value", () => {
		expect(posthogHosts("").ingest).toBe("https://us.i.posthog.com");
		expect(posthogHosts().ui).toBe("https://us.posthog.com");
	});

	it("uses one host for everything when self-hosted", () => {
		const hosts = posthogHosts("https://ph.example.com/");
		expect(new Set(Object.values(hosts))).toEqual(
			new Set(["https://ph.example.com"]),
		);
	});
});

describe("upstreamRoute", () => {
	const host = "https://us.i.posthog.com";

	it("keeps the path, its trailing slash and the query", () => {
		const route = upstreamRoute(
			"https://example.com/ingest/i/v0/e/?ip=0&_=1",
			host,
		);
		expect(route?.url.href).toBe("https://us.i.posthog.com/i/v0/e/?ip=0&_=1");
		expect(route?.cache).toBeNull();
	});

	it("sends static files to the assets host, cached", () => {
		const route = upstreamRoute(
			"https://example.com/ingest/static/array.js?v=1",
			host,
		);
		expect(route?.url.href).toBe(
			"https://us-assets.i.posthog.com/static/array.js?v=1",
		);
		expect(route?.cache).toContain("s-maxage=86400");
	});

	it("ignores paths outside /ingest", () => {
		expect(upstreamRoute("https://example.com/ingestion", host)).toBeNull();
		expect(upstreamRoute("https://example.com/api/x", host)).toBeNull();
	});
});

describe("proxy headers", () => {
	it("never forwards the session cookie or authorization", () => {
		const headers = upstreamRequestHeaders(
			new Headers({
				cookie: "better-auth.session_token=secret",
				authorization: "Bearer tk_secret",
				"content-type": "application/json",
				"x-forwarded-for": "203.0.113.7, 10.0.0.1",
			}),
		);
		expect(headers.get("cookie")).toBeNull();
		expect(headers.get("authorization")).toBeNull();
		expect(headers.get("content-type")).toBe("application/json");
		expect(headers.get("x-forwarded-for")).toBe("203.0.113.7");
	});

	it("never passes Set-Cookie back, and does not cache errors", () => {
		const upstream = new Response("{}", {
			status: 500,
			headers: { "set-cookie": "a=b", "content-type": "application/json" },
		});
		const headers = downstreamResponseHeaders(upstream, "public, max-age=60");
		expect(headers.get("set-cookie")).toBeNull();
		expect(headers.get("cache-control")).toBe("no-store");
	});

	it("streams the request through to PostHog", async () => {
		let sent: { url: string; init?: RequestInit } | undefined;
		const fakeFetch = (async (url: URL, init?: RequestInit) => {
			sent = { url: url.href, init };
			return new Response("ok", { status: 200 });
		}) as typeof fetch;
		const response = await proxyToPostHog(
			new Request("https://example.com/ingest/flags/?v=2", {
				method: "POST",
				body: "{}",
				headers: { cookie: "session=secret" },
			}),
			"https://eu.i.posthog.com",
			fakeFetch,
		);
		expect(response.status).toBe(200);
		expect(sent?.url).toBe("https://eu.i.posthog.com/flags/?v=2");
		expect(new Headers(sent?.init?.headers).get("cookie")).toBeNull();
	});

	it("answers 502 at once when PostHog is unreachable", async () => {
		const failingFetch = (async () => {
			throw new TypeError("fetch failed");
		}) as typeof fetch;
		const response = await proxyToPostHog(
			new Request("https://example.com/ingest/static/array.js"),
			"https://eu.i.posthog.com",
			failingFetch,
		);
		expect(response.status).toBe(502);
		expect(response.headers.get("cache-control")).toBe("no-store");
	});
});

describe("server without a key", () => {
	it("does nothing, and flags are off", async () => {
		expect(process.env.NEXT_PUBLIC_POSTHOG_KEY).toBeUndefined();
		track("user", "project_created", {});
		await captureException(new Error("boom"));
		expect(await isFeatureEnabled("new-dashboard")).toBe(false);
	});
});
