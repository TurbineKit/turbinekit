import { type BrowserContext, devices, expect, test } from "@playwright/test";

/**
 * PostHog stores nothing until the visitor accepts: no cookie before a
 * choice, none after Reject (cookieless capture), its cookie after Accept.
 * Runs only when the build has NEXT_PUBLIC_POSTHOG_KEY (playwright.config.ts);
 * /ingest is answered here, so nothing reaches PostHog.
 */

async function visitorInFrance(browser: import("@playwright/test").Browser) {
	const context = await browser.newContext({
		userAgent: devices["Desktop Chrome"].userAgent,
		extraHTTPHeaders: { "x-vercel-ip-country": "FR" },
	});
	// PostHog skips automated browsers.
	await context.addInitScript(() => {
		Object.defineProperty(Navigator.prototype, "webdriver", {
			get: () => false,
		});
		Object.defineProperty(Navigator.prototype, "userAgentData", {
			get: () => undefined,
		});
	});
	await context.route("**/ingest/**", (route) => {
		const path = new URL(route.request().url()).pathname;
		return path.endsWith("/config.js")
			? route.fulfill({ contentType: "application/javascript", body: "" })
			: route.fulfill({ contentType: "application/json", body: "{}" });
	});
	return context;
}

async function posthogCookies(context: BrowserContext) {
	return (await context.cookies())
		.map((cookie) => cookie.name)
		.filter((name) => name.startsWith("ph_"));
}

for (const [label, choice, stored] of [
	["Reject", /reject/i, false],
	["Accept", /accept/i, true],
] as const) {
	test(`PostHog stores a cookie only after Accept (${label})`, async ({
		browser,
	}) => {
		const context = await visitorInFrance(browser);
		const page = await context.newPage();
		await page.goto("/");
		await expect(page.getByTestId("consent-banner-root")).toBeVisible();
		expect(await posthogCookies(context)).toEqual([]);

		await page
			.getByTestId("consent-banner-root")
			.getByRole("button", { name: choice })
			.click();
		await page.reload();
		await expect
			.poll(async () => (await posthogCookies(context)).length > 0)
			.toBe(stored);
		await context.close();
	});
}
