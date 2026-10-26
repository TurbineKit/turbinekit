import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { templateFiles } from "./generate.ts";
import { isMarkable, MARKER_IDS, stripMarkers } from "./markers.ts";
import {
	EMAIL_PROVIDERS,
	FILES_DRIVERS,
	type Manifest,
	MODULES,
	PAIRS,
	TEMPLATE_ONLY,
} from "./modules.ts";
import { LOCALES } from "./options.ts";

/** The repository is the template. */
const root = resolve(import.meta.dirname, "../../..");
const source = { root, kind: "checkout" as const };

describe("the template's markers", () => {
	it("parse in every file, with every module on and with none", async () => {
		const all = new Set<string>(MARKER_IDS);
		const problems: string[] = [];
		for (const file of await templateFiles(source)) {
			if (!isMarkable(file) || file.startsWith("tooling/")) {
				continue;
			}
			const text = await readFile(join(root, file), "utf8").catch(() => null);
			if (text === null) {
				continue;
			}
			for (const enabled of [all, new Set<string>()]) {
				try {
					stripMarkers(text, enabled, file);
				} catch (error) {
					problems.push((error as Error).message);
				}
			}
		}
		expect(problems).toEqual([]);
	});
});

describe("the manifests", () => {
	it("name only paths that exist", async () => {
		const files = await templateFiles(source);
		const manifests: Manifest[] = [
			...MODULES,
			...Object.values(EMAIL_PROVIDERS),
			...Object.values(FILES_DRIVERS),
			...PAIRS,
		];
		const missing = manifests
			.flatMap((manifest) => manifest.files ?? [])
			.filter(
				(path) =>
					!files.some((file) => file === path || file.startsWith(`${path}/`)),
			);
		expect(missing).toEqual([]);
	});

	it("name dependencies, scripts and messages that exist", async () => {
		const missing: string[] = [];
		for (const manifest of [
			...MODULES,
			...Object.values(EMAIL_PROVIDERS),
			...Object.values(FILES_DRIVERS),
		]) {
			for (const [file, names] of Object.entries(manifest.dependencies ?? {})) {
				const json = JSON.parse(await readFile(join(root, file), "utf8"));
				for (const name of names) {
					if (!(json.dependencies?.[name] || json.devDependencies?.[name])) {
						missing.push(`${file}: ${name}`);
					}
				}
			}
			for (const [file, names] of Object.entries(manifest.scripts ?? {})) {
				const json = JSON.parse(await readFile(join(root, file), "utf8"));
				for (const name of names) {
					if (!json.scripts?.[name]) {
						missing.push(`${file}: script ${name}`);
					}
				}
			}
			const messages = JSON.parse(
				await readFile(join(root, "apps/web/messages/en.json"), "utf8"),
			);
			for (const key of manifest.messages ?? []) {
				const found = key
					.split(".")
					.reduce<unknown>(
						(node, part) =>
							(node as Record<string, unknown> | undefined)?.[part],
						messages,
					);
				if (found === undefined) {
					missing.push(`messages: ${key}`);
				}
			}
		}
		expect(missing).toEqual([]);
	});

	it("keep template-only paths out of projects", () => {
		expect(TEMPLATE_ONLY).toContain("tooling");
	});
});

describe("the languages", () => {
	it("are the ones packages/i18n lists, each with its files", async () => {
		const codes = Object.keys(LOCALES);
		const i18n = await readFile(
			join(root, "packages/i18n/src/index.ts"),
			"utf8",
		);
		const listed = i18n
			.match(/export const locales = \[([^\]]*)\] as const;/)?.[1]
			?.match(/"[^"]+"/g)
			?.map((code) => code.slice(1, -1));
		expect(listed).toEqual(codes);
		expect(MARKER_IDS).toEqual(
			expect.arrayContaining(codes.filter((code) => code !== "en")),
		);

		const files = await templateFiles(source);
		const legal = new Set(
			files
				.filter((file) => file.startsWith("apps/web/content/legal/"))
				.map((file) => file.split("/")[4]),
		);
		const missing = codes.flatMap((code) =>
			[
				`apps/web/messages/${code}.json`,
				`packages/email/src/strings/${code}.ts`,
				...[...legal].map(
					(slug) => `apps/web/content/legal/${slug}/${code}.mdx`,
				),
				...(code === "en" ? [] : [`apps/docs/docs/${code}/index.mdx`]),
			].filter((path) => !files.includes(path)),
		);
		expect(missing).toEqual([]);
	});
});
