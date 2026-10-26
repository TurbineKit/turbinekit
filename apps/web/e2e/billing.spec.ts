import { expect, test } from "@playwright/test";
import {
	createUser,
	dismissConsent, // turbinekit:consent
	signIn,
} from "./support.ts";

test("the pricing page lists the plans", async ({ page }) => {
	await page.goto("/pricing");
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	await expect(page.getByText("/ month").first()).toBeVisible();
});

test("the free plan stops at its project limit", async ({ page }) => {
	const user = await createUser(page.request, "Pat");
	await dismissConsent(page); // turbinekit:consent
	await signIn(page, user);
	await page.goto("/projects");
	const createProject = async (name: string) => {
		await page.getByRole("button", { name: "New project" }).first().click();
		await page.getByRole("dialog").getByLabel("Name").fill(name);
		await page
			.getByRole("dialog")
			.getByRole("button", { name: "Save" })
			.click();
	};
	for (const name of ["One", "Two", "Three"]) {
		await createProject(name);
		await expect(page.getByRole("dialog")).toBeHidden();
	}
	await createProject("Four");
	await expect(page.getByText(/Your plan allows 3 projects/)).toBeVisible();
});
