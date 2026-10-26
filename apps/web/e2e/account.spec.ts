import { expect, test } from "@playwright/test";
import {
	clientIp,
	createUser,
	dismissConsent, // turbinekit:consent
	linkFromMailbox,
	newUser,
	signIn,
} from "./support.ts";

test("sign up, confirm the email, land on the dashboard", async ({
	browser,
}) => {
	// The browser's own address, for the sign-up rate limit.
	const context = await browser.newContext({
		extraHTTPHeaders: { "x-forwarded-for": clientIp() },
	});
	const page = await context.newPage();
	const user = newUser("Ada");
	await dismissConsent(page); // turbinekit:consent
	await page.goto("/sign-up");
	await page.getByLabel("Name").fill(user.name);
	await page.getByLabel("Email").fill(user.email);
	await page.getByLabel("Password").fill(user.password);
	await page.getByRole("button", { name: "Create account" }).click();
	await expect(page).toHaveURL(/\/verify-email/);

	const link = await linkFromMailbox(
		page.request,
		user.email,
		/https?:\/\/\S+verify-email\S+/,
	);
	await page.goto(link);
	await expect(page).toHaveURL(/\/dashboard$/);
	await expect(page.getByText(`Welcome, ${user.name}`)).toBeVisible();
	await context.close();
});

test("an API key reaches the REST API and the MCP server", async ({ page }) => {
	const user = await createUser(page.request, "Grace");
	await dismissConsent(page); // turbinekit:consent
	await signIn(page, user);
	await page.goto("/account/api-keys");
	await page.getByRole("button", { name: "Create a key" }).click();
	const dialog = page.getByRole("dialog");
	await dialog.getByLabel("Name").fill("e2e");
	await dialog.getByLabel("Access").click();
	await page.getByRole("option", { name: "Read and write" }).click();
	await dialog.getByRole("button", { name: "Create a key" }).click();
	const key = ((await dialog.locator("code").textContent()) ?? "").trim();

	const headers = { authorization: `Bearer ${key}` };
	const created = await page.request.post("/api/v1/projects", {
		headers,
		data: { name: "From e2e" },
	});
	expect(created.status()).toBe(201);
	const listed = await page.request.get("/api/v1/projects", { headers });
	expect(JSON.stringify(await listed.json())).toContain("From e2e");

	const tools = await page.request.post("/mcp", {
		headers: {
			...headers,
			accept: "application/json, text/event-stream",
			"mcp-protocol-version": "2025-06-18",
		},
		data: { jsonrpc: "2.0", id: 1, method: "tools/list" },
	});
	expect(await tools.text()).toContain("create_project");
});
