import { createTestDb, type TestDb } from "@repo/db/testing";
import { readMailbox, strings } from "@repo/email";
import { defaultLocale, locales } from "@repo/i18n";
import { site } from "@repo/site";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { permissionsFromScopes, scopesFromPermissions } from "./permissions.ts";
import { type Auth, createAuth } from "./server.ts";

/** Waits for an email sent in the background, then returns it. */
async function waitForEmail(to: string, subject: string) {
	for (let attempt = 0; attempt < 50; attempt++) {
		const email = readMailbox(to).find((entry) => entry.subject === subject);
		if (email) {
			return email;
		}
		await new Promise((resolve) => setTimeout(resolve, 20));
	}
	throw new Error(`No email "${subject}" for ${to}`);
}

describe("auth", () => {
	let db: TestDb;
	let close: () => Promise<void>;
	let auth: Auth;

	beforeAll(async () => {
		({ db, close } = await createTestDb());
		auth = createAuth(db, { nextjs: false });
	});
	afterAll(async () => {
		await close();
	});

	it("signs up, verifies the email, then signs in", async () => {
		const email = "grace@example.com";
		const password = "correct horse battery staple";
		// The last locale: a translated one, when the site has several.
		const locale = locales.at(-1) ?? defaultLocale;
		await auth.api.signUpEmail({
			body: { name: "Grace", email, password, locale },
		});

		// Unverified: no session yet.
		await expect(
			auth.api.signInEmail({ body: { email, password } }),
		).rejects.toThrow();

		const verification = await waitForEmail(
			email,
			strings(locale).verifyEmail.subject,
		);
		const link = verification.text.match(/https?:\/\/\S+verify-email\S+/)?.[0];
		expect(link).toBeDefined();
		const token = new URL(link as string).searchParams.get("token");
		await auth.api.verifyEmail({ query: { token: token as string } });

		const session = await auth.api.signInEmail({ body: { email, password } });
		expect(session.user.email).toBe(email);
		expect(session.user.id).toMatch(/^usr_/);
	});

	it("creates an API key on the server and verifies it with its permissions", async () => {
		const [user] = await db.query.user.findMany({ limit: 1 });
		const key = await auth.api.createApiKey({
			body: {
				name: "CI",
				userId: user?.id,
				permissions: permissionsFromScopes(["projects:read", "projects:write"]),
			},
		});
		expect(key.key.startsWith(site.apiKeyPrefix)).toBe(true);

		const result = await auth.api.verifyApiKey({ body: { key: key.key } });
		expect(result.valid).toBe(true);
		expect(scopesFromPermissions(result.key?.permissions)).toEqual([
			"projects:read",
			"projects:write",
		]);
	});
});
