import { expect, test } from "@playwright/test";
import {
	createUser,
	dismissConsent, // turbinekit:consent
	linkFromMailbox,
	signIn,
} from "./support.ts";

test("a team: create, invite, accept, share projects, remove", async ({
	browser,
	request,
}) => {
	const owner = await createUser(request, "Alice");
	const member = await createUser(request, "Bob");
	const team = `Acme ${Date.now()}`;

	const ownerContext = await browser.newContext();
	const a = await ownerContext.newPage();
	await dismissConsent(a); // turbinekit:consent
	await signIn(a, owner);
	await a.goto("/org");
	await a.getByLabel("Team name").fill(team);
	await a.getByRole("button", { name: "Create the team" }).click();
	await expect(a.getByText("Members", { exact: true })).toBeVisible();
	await a.locator("#invite-email").fill(member.email);
	await a.getByRole("button", { name: "Invite", exact: true }).click();
	const invitation = await linkFromMailbox(
		request,
		member.email,
		/https?:\/\/\S+\/org\/invitations\/\S+/,
	);

	const memberContext = await browser.newContext();
	const b = await memberContext.newPage();
	await dismissConsent(b); // turbinekit:consent
	await signIn(b, member);
	await b.goto(invitation);
	await b.getByRole("button", { name: "Accept", exact: true }).click();
	await expect(b).toHaveURL(/\/org$/);
	await expect(b.getByLabel("Name")).toHaveValue(team);

	// A project made in the team shows for every member, not in personal space.
	await b.goto("/projects");
	await b.getByRole("button", { name: "New project" }).first().click();
	await b.getByRole("dialog").getByLabel("Name").fill("Team rocket");
	await b.getByRole("dialog").getByRole("button", { name: "Save" }).click();
	await expect(b.getByRole("dialog")).toBeHidden();
	await a.goto("/projects");
	await expect(a.getByText("Team rocket")).toBeVisible();

	// Removed, Bob loses the team.
	await a.goto("/org");
	await a.getByRole("button", { name: "Remove" }).click();
	await a
		.getByRole("alertdialog")
		.getByRole("button", { name: "Remove" })
		.click();
	await expect(a.getByText(member.email)).toBeHidden();

	await ownerContext.close();
	await memberContext.close();
});
