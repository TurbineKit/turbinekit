import { expect, test } from "@playwright/test";

const banner = "consent-banner-root";

test("visitors in the EU choose first, and the choice sticks", async ({
	browser,
}) => {
	const context = await browser.newContext({
		extraHTTPHeaders: { "x-vercel-ip-country": "FR" },
	});
	const page = await context.newPage();
	await page.goto("/");
	await expect(page.getByTestId(banner)).toBeVisible();
	await page
		.getByTestId(banner)
		.getByRole("button", { name: /reject/i })
		.click();
	await expect
		.poll(async () => (await context.cookies()).some((c) => c.name === "c15t"))
		.toBe(true);
	await page.reload();
	await expect(page.getByTestId(banner)).toBeHidden();

	// The footer reopens the choices.
	await page.getByRole("button", { name: "Cookie settings" }).click();
	await expect(page.getByRole("dialog")).toBeVisible();
	await context.close();
});

test("visitors elsewhere get no banner", async ({ browser }) => {
	const context = await browser.newContext({
		extraHTTPHeaders: {
			"x-vercel-ip-country": "US",
			"x-vercel-ip-country-region": "OH",
		},
	});
	const page = await context.newPage();
	await page.goto("/");
	await page.waitForLoadState("networkidle");
	await expect(page.getByTestId(banner)).toBeHidden();
	await context.close();
});
