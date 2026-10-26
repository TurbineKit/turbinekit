import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import {
	createUser,
	dismissConsent, // turbinekit:consent
	signIn,
} from "./support.ts";

test("admins ban, unban and view the app as a user, all audited", async ({
	browser,
	request,
}) => {
	const admin = await createUser(request, "Root");
	const user = await createUser(request, "Val");
	execFileSync("pnpm", ["admin:grant", admin.email], {
		cwd: resolve(import.meta.dirname, "../../.."),
		stdio: "pipe",
	});

	const context = await browser.newContext();
	const page = await context.newPage();
	await dismissConsent(page); // turbinekit:consent
	await signIn(page, admin);
	await page.goto(`/admin?q=${encodeURIComponent(user.email)}`);
	const row = page.getByRole("row").filter({ hasText: user.email });
	const menu = row.getByRole("button", { name: `Actions for ${user.name}` });

	await menu.click();
	await page.getByRole("menuitem", { name: "Ban" }).click();
	await page.getByRole("dialog").getByRole("button", { name: "Ban" }).click();
	await expect(row.getByText("Banned", { exact: true })).toBeVisible();

	await menu.click();
	await page.getByRole("menuitem", { name: "Unban" }).click();
	await expect(row.getByText("Active", { exact: true })).toBeVisible();

	await menu.click();
	await page
		.getByRole("menuitem", { name: "View the app as this user" })
		.click();
	await expect(
		page.getByText(`You are viewing the app as ${user.name}`),
	).toBeVisible();
	await page.getByRole("button", { name: "Back to your account" }).click();
	await expect(page).toHaveURL(/\/admin$/);

	await page.goto("/admin/audit");
	const audit = page.locator("table");
	for (const action of ["Banned", "Unbanned", "Viewed the app as"]) {
		await expect(audit).toContainText(action);
	}
	await context.close();
});
