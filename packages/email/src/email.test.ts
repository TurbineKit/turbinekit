import { defaultLocale, locales } from "@repo/i18n";
import { describe, expect, it } from "vitest";
import {
	type EmailTemplate,
	readMailbox,
	renderEmail,
	sendEmail,
	type TemplateProps,
} from "./index.ts";
import { fill, strings } from "./strings/index.ts";

/** Props for every template: TypeScript asks for one when you add a template. */
const SAMPLES: { [K in EmailTemplate]: TemplateProps[K] } = {
	"verify-email": { url: "https://example.com/verify" },
	"reset-password": { url: "https://example.com/reset" },
	"two-factor-code": { code: "424242" },
	// #region turbinekit:orgs
	"organization-invite": {
		url: "https://example.com/org/invitations/inv_1",
		organization: "Acme",
		inviter: "Ada",
	},
	// #endregion turbinekit:orgs
};

describe("renderEmail", () => {
	it("renders HTML and text in the recipient's language", async () => {
		const url = "https://example.com/verify?token=abc";
		for (const locale of locales) {
			const email = await renderEmail("verify-email", { url }, locale);
			const t = strings(locale).verifyEmail;
			expect(email.subject).toBe(t.subject);
			expect(email.html).toContain(url);
			expect(email.html).toContain(`lang="${locale}"`);
			expect(email.text).toContain(t.button);
		}
	});

	it("falls back to the default locale", async () => {
		const email = await renderEmail("verify-email", { url: "x" }, "xx");
		expect(email.subject).toBe(strings(defaultLocale).verifyEmail.subject);
	});

	it("fills placeholders in subjects", async () => {
		const { subject } = await renderEmail(
			"two-factor-code",
			{ code: "424242" },
			"en",
		);
		expect(subject).toBe("Your sign-in code: 424242");
	});
});

describe("every template", () => {
	it("renders in every locale, with every placeholder filled", async () => {
		for (const locale of locales) {
			for (const [template, props] of Object.entries(SAMPLES)) {
				const email = await renderEmail(
					template as EmailTemplate,
					props as never,
					locale,
				);
				const label = `${template} (${locale})`;
				expect(email.subject, label).not.toMatch(/[{}]/);
				expect(email.html, label).toContain(`lang="${locale}"`);
				expect(email.text.trim(), label).not.toBe("");
				expect(email.text, label).not.toMatch(/\{\w+\}/);
			}
		}
	});
});

describe("sendEmail", () => {
	it("prints to the console and keeps the email in the dev mailbox", async () => {
		const locale = locales.at(-1) ?? defaultLocale;
		await sendEmail({
			to: "ada@example.com",
			template: "reset-password",
			props: { url: "https://example.com/reset?token=xyz" },
			locale,
		});
		const [latest] = readMailbox("ada@example.com");
		expect(latest?.subject).toBe(strings(locale).resetPassword.subject);
		expect(latest?.text).toContain("https://example.com/reset?token=xyz");
	});
});

describe("fill", () => {
	it("leaves unknown placeholders alone", () => {
		expect(fill("{a} and {b}", { a: 1 })).toBe("1 and {b}");
	});
});
