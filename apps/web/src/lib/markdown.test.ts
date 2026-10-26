import { locales } from "@repo/i18n";
import { describe, expect, it } from "vitest";
import { pageToMarkdown } from "@/lib/markdown";
import { markdownPath } from "@/lib/markdown-path";
import { clampText } from "@/lib/og";

const html = `<!doctype html><html lang="fr"><head>
<title>Tarifs · Acme</title>
<meta name="description" content="Forfaits et prix.">
<link rel="canonical" href="https://acme.test/fr/pricing">
</head><body>
<nav><a href="/">Accueil</a></nav>
<main>
<h1>Tarifs</h1>
<p>Voir la <a href="/fr/legal/terms">politique</a>.</p>
<div aria-hidden="true">décor</div>
<div data-markdown="skip">widget</div>
<script>alert(1)</script>
</main>
</body></html>`;

describe("pageToMarkdown", () => {
	it("keeps the main content, with front matter and absolute links", async () => {
		const markdown = await pageToMarkdown(html, "https://acme.test/fr/pricing");
		expect(markdown).toContain('title: "Tarifs · Acme"');
		expect(markdown).toContain("url: https://acme.test/fr/pricing");
		expect(markdown).toContain("language: fr");
		expect(markdown).toContain("# Tarifs");
		expect(markdown).toContain("[politique](https://acme.test/fr/legal/terms)");
	});

	it("drops navigation, scripts, hidden and skipped parts", async () => {
		const markdown = await pageToMarkdown(html, "https://acme.test/fr/pricing");
		expect(markdown).not.toContain("Accueil");
		expect(markdown).not.toContain("alert");
		expect(markdown).not.toContain("décor");
		expect(markdown).not.toContain("widget");
	});
});

describe("markdownPath", () => {
	it("adds .md, and index.md for home pages", () => {
		expect(markdownPath("/")).toBe("/index.md");
		expect(markdownPath("/legal/terms/")).toBe("/legal/terms.md");
		for (const locale of locales) {
			expect(markdownPath(`/${locale}`)).toBe(`/${locale}/index.md`);
			expect(markdownPath(`/${locale}/pricing`)).toBe(`/${locale}/pricing.md`);
		}
	});
});

describe("clampText", () => {
	it("cuts long text on code points", () => {
		expect(clampText("short", 10)).toBe("short");
		expect(clampText("a".repeat(20), 10)).toBe(`${"a".repeat(9)}…`);
		expect(clampText("😀".repeat(5), 3)).toBe("😀😀…");
	});
});
