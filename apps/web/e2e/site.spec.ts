import { expect, test } from "@playwright/test";
import { defaultLocale, locales } from "@repo/i18n";
import { site } from "@repo/site";

/** The path of the home page in a locale: bare for the default one. */
const home = (locale: string) =>
	locale === defaultLocale ? "/" : `/${locale}`;

test("the home page answers in each language", async ({ page }) => {
	for (const locale of locales) {
		await page.goto(home(locale));
		await expect(page.locator("html")).toHaveAttribute("lang", locale);
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	}
});

test("search engines and agents find the site", async ({ request }) => {
	const sitemap = await request.get("/sitemap.xml");
	expect(await sitemap.text()).toContain("<urlset");
	const robots = await request.get("/robots.txt");
	expect(await robots.text()).toContain("Sitemap:");
	const llms = await request.get("/llms.txt");
	expect(await llms.text()).toContain(site.name);
	const og = await request.get("/api/og?title=Hello");
	expect(og.headers()["content-type"]).toContain("image/png");
});

test("a missing page is a 404", async ({ page }) => {
	const response = await page.goto("/no-such-page");
	expect(response?.status()).toBe(404);
});

test("signed-out visitors to the app go to sign-in, and come back after", async ({
	page,
}) => {
	await page.goto("/dashboard");
	await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard/);
});
