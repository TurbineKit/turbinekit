import { defaultLocale, locales } from "@repo/i18n";
import { describe, expect, it } from "vitest";
import robots from "@/app/robots";

describe("robots.txt", () => {
	const { rules } = robots();
	const rule = Array.isArray(rules) ? rules[0] : rules;

	it("keeps share cards open while closing the rest of the API", () => {
		expect(rule?.allow).toContain("/api/og");
		expect(rule?.disallow).toContain("/api/");
		expect(rule?.disallow).toContain("/mcp");
	});

	it("closes signed-in pages in every locale", () => {
		expect(rule?.disallow).toContain("/dashboard");
		for (const locale of locales.filter((code) => code !== defaultLocale)) {
			expect(rule?.disallow).toContain(`/${locale}/dashboard`);
			expect(rule?.disallow).toContain(`/${locale}/sign-in`);
		}
	});
});
