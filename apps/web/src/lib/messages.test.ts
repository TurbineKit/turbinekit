import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { defaultLocale, locales } from "@repo/i18n";
import { describe, expect, it } from "vitest";
import { SERVER_ONLY_NAMESPACES } from "@/lib/client-messages";

type Catalog = { [key: string]: string | Catalog };

const messagesDir = join(import.meta.dirname, "../../messages");

async function load(locale: string): Promise<Catalog> {
	return JSON.parse(
		await readFile(join(messagesDir, `${locale}.json`), "utf8"),
	);
}

/** Every leaf key with its text: `Nav.home` → "Home". */
function flatten(catalog: Catalog, prefix = ""): Map<string, string> {
	const entries = new Map<string, string>();
	for (const [key, value] of Object.entries(catalog)) {
		const path = prefix ? `${prefix}.${key}` : key;
		if (typeof value === "string") {
			entries.set(path, value);
		} else {
			for (const [child, text] of flatten(value, path)) {
				entries.set(child, text);
			}
		}
	}
	return entries;
}

/**
 * The ICU arguments a message uses: `{name}`, `{count, plural, …}`. Branch
 * text like `{No project yet}` is not an argument: it has no `,` or `}` right
 * after one word.
 */
function argumentsOf(message: string): string[] {
	return [...message.matchAll(/\{\s*([a-zA-Z_]\w*)\s*[,}]/g)]
		.map((match) => match[1] as string)
		.sort();
}

describe("message catalogs", () => {
	it("has one catalog per locale, and no other", async () => {
		const files = (await readdir(messagesDir)).filter((file) =>
			file.endsWith(".json"),
		);
		expect(files.sort()).toEqual(
			locales.map((locale) => `${locale}.json`).sort(),
		);
	});

	for (const locale of locales.filter((code) => code !== defaultLocale)) {
		it(`${locale} has the same keys and arguments as ${defaultLocale}`, async () => {
			const reference = flatten(await load(defaultLocale));
			const catalog = flatten(await load(locale));
			expect([...catalog.keys()].sort()).toEqual([...reference.keys()].sort());
			for (const [key, text] of reference) {
				expect(argumentsOf(catalog.get(key) ?? ""), key).toEqual(
					argumentsOf(text),
				);
			}
		});
	}
});

describe("server-only namespaces", () => {
	it("are never read by useTranslations", async () => {
		const sourceDir = join(import.meta.dirname, "..");
		const offenders: string[] = [];
		for (const file of await readdir(sourceDir, { recursive: true })) {
			if (!/\.tsx?$/.test(file) || file.endsWith(".test.ts")) {
				continue;
			}
			const source = await readFile(join(sourceDir, file), "utf8");
			for (const match of source.matchAll(/useTranslations\("([\w]+)/g)) {
				if (SERVER_ONLY_NAMESPACES.includes(match[1] as string)) {
					offenders.push(`${file}: ${match[1]}`);
				}
			}
		}
		expect(offenders).toEqual([]);
	});
});
