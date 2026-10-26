import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3000);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;

/**
 * Smoke tests of the running app: `pnpm --filter web test:e2e`. They need a
 * migrated database and EMAIL_TRANSPORT=console: sign-up reads the dev
 * mailbox. Without E2E_BASE_URL, Playwright serves the production build
 * (`pnpm build` first); with it, the tests use that server.
 */
export default defineConfig({
	testDir: "e2e",
	// #region turbinekit:analytics+consent
	// PostHog only runs in a build that has NEXT_PUBLIC_POSTHOG_KEY.
	testIgnore: process.env.NEXT_PUBLIC_POSTHOG_KEY
		? []
		: ["**/analytics-consent.spec.ts"],
	// #endregion turbinekit:analytics+consent
	// One at a time: the tests share one database and its rate limits.
	workers: 1,
	fullyParallel: false,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
	use: {
		baseURL,
		trace: "retain-on-failure",
		viewport: { width: 1440, height: 1000 },
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: process.env.E2E_BASE_URL
		? undefined
		: {
				command: `pnpm exec next start -p ${port}`,
				url: baseURL,
				reuseExistingServer: !process.env.CI,
				timeout: 120_000,
			},
});
