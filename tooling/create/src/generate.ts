import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
	copyFile,
	lstat,
	mkdir,
	readdir,
	readFile,
	readlink,
	rename,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { isMarkable, stripMarkers } from "./markers.ts";
import {
	EMAIL_PROVIDERS,
	FILES_DRIVERS,
	IGNORED,
	type Manifest,
	MODULES,
	PAIRS,
	TEMPLATE_MANIFEST,
	TEMPLATE_ONLY,
} from "./modules.ts";
import type { Answers } from "./options.ts";

/** A TurbineKit template: the bundled copy, or a git checkout (development). */
export type Source = { root: string; kind: "bundle" | "checkout" };

/** The ids the markers see as on. */
export function enabledIds(answers: Answers): Set<string> {
	const ids = new Set<string>(answers.modules);
	ids.add(answers.emailProvider);
	if (answers.modules.includes("files") && answers.filesDriver !== "local") {
		ids.add(answers.filesDriver === "s3" ? "files-s3" : "files-blob");
	}
	return ids;
}

/** Every manifest whose code the project doesn't get. */
function removedManifests(answers: Answers): Manifest[] {
	const off: Manifest[] = [
		TEMPLATE_MANIFEST,
		...MODULES.filter((module) => !answers.modules.includes(module.id)),
	];
	for (const [id, provider] of Object.entries(EMAIL_PROVIDERS)) {
		if (id !== answers.emailProvider) {
			off.push(provider);
		}
	}
	for (const [id, driver] of Object.entries(FILES_DRIVERS)) {
		if (id !== answers.filesDriver || !answers.modules.includes("files")) {
			off.push(driver);
		}
	}
	for (const pair of PAIRS) {
		if (!pair.modules.every((id) => answers.modules.includes(id))) {
			off.push({ files: pair.files });
		}
	}
	return off;
}

/** Paths the project doesn't get, from its root. */
function removedPaths(answers: Answers): string[] {
	const paths = [
		...TEMPLATE_ONLY,
		"turbinekit.json",
		"README.md",
		"LICENSE",
		...removedManifests(answers).flatMap((manifest) => manifest.files ?? []),
	];
	if (!answers.locales.includes("fr")) {
		paths.push(
			"apps/web/messages/fr.json",
			"packages/email/src/strings/fr.ts",
			"apps/docs/docs/fr",
		);
	}
	return paths;
}

function isUnder(file: string, paths: readonly string[]): boolean {
	return paths.some((path) => file === path || file.startsWith(`${path}/`));
}

async function walk(root: string, prefix = ""): Promise<string[]> {
	const files: string[] = [];
	for (const entry of await readdir(join(root, prefix), {
		withFileTypes: true,
	})) {
		if (IGNORED.has(entry.name)) {
			continue;
		}
		const path = prefix ? `${prefix}/${entry.name}` : entry.name;
		if (entry.isDirectory()) {
			files.push(...(await walk(root, path)));
		} else {
			files.push(path);
		}
	}
	return files;
}

/** The template's files, relative to its root. */
export async function templateFiles(source: Source): Promise<string[]> {
	if (source.kind === "bundle") {
		// npm renames .gitignore files: the bundle ships them as _gitignore.
		return (await walk(source.root))
			.filter((file) => file !== SYMLINKS)
			.map((file) => file.replace(/(^|\/)_gitignore$/, "$1.gitignore"));
	}
	const listed = execFileSync(
		"git",
		["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
		{ cwd: source.root, maxBuffer: 64 * 1024 * 1024 },
	)
		.toString()
		.split("\0")
		.filter(Boolean);
	const files: string[] = [];
	for (const file of listed) {
		const parts = file.split("/");
		if (parts.some((part) => IGNORED.has(part))) {
			continue;
		}
		// A tracked file deleted in the working tree.
		if (await lstat(join(source.root, file)).catch(() => null)) {
			files.push(file);
		}
	}
	return files;
}

/** The bundle's list of symlinks, which npm doesn't keep. */
const SYMLINKS = "_symlinks.json";

const TEXT =
	/\.(ts|tsx|js|mjs|cjs|json|jsonc|md|mdx|css|ya?ml|sql|svg|txt|html)$|(^|\/)\.[\w.-]+$/;

/** `@repo/ui` → `@<slug>/ui`, in every text file. */
function renameScope(text: string, slug: string): string {
	return text.replaceAll("@repo/", `@${slug}/`);
}

/** Copies the template into the project, keeping only the chosen modules. */
export async function copyTemplate(
	source: Source,
	answers: Answers,
): Promise<number> {
	const enabled = enabledIds(answers);
	const removed = removedPaths(answers);
	const legalRemoved = answers.locales.includes("fr")
		? null
		: /^apps\/web\/content\/legal\/[\w-]+\/fr\.mdx$/;
	let count = 0;
	for (const file of await templateFiles(source)) {
		if (isUnder(file, removed) || legalRemoved?.test(file)) {
			continue;
		}
		const from = join(
			source.root,
			source.kind === "bundle"
				? file.replace(/(^|\/)\.gitignore$/, "$1_gitignore")
				: file,
		);
		const to = join(answers.directory, file);
		await mkdir(dirname(to), { recursive: true });
		const info = await lstat(from);
		if (info.isSymbolicLink()) {
			await symlink(await readlink(from), to);
		} else if (TEXT.test(file)) {
			let text = await readFile(from, "utf8");
			if (isMarkable(file)) {
				text = stripMarkers(text, enabled, file);
			}
			await writeFile(to, renameScope(text, answers.slug));
		} else {
			await copyFile(from, to);
		}
		count++;
	}
	if (source.kind === "bundle") {
		const links = JSON.parse(
			await readFile(join(source.root, SYMLINKS), "utf8"),
		) as Record<string, string>;
		for (const [file, target] of Object.entries(links)) {
			if (!isUnder(file, removed)) {
				await mkdir(dirname(join(answers.directory, file)), {
					recursive: true,
				});
				await symlink(target, join(answers.directory, file));
			}
		}
	}
	return count;
}

async function readJson(path: string): Promise<Record<string, unknown>> {
	return JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
}

async function writeJson(path: string, value: unknown): Promise<void> {
	await writeFile(path, `${JSON.stringify(value, null, "\t")}\n`);
}

async function exists(path: string): Promise<boolean> {
	return Boolean(await lstat(path).catch(() => null));
}

/** Deletes `a.b.c` from an object, and parents it leaves empty. */
function deletePath(object: Record<string, unknown>, path: string): void {
	const [head, ...rest] = path.split(".");
	if (!head || !(head in object)) {
		return;
	}
	if (rest.length === 0) {
		delete object[head];
		return;
	}
	const child = object[head];
	if (child && typeof child === "object") {
		deletePath(child as Record<string, unknown>, rest.join("."));
		if (Object.keys(child).length === 0) {
			delete object[head];
		}
	}
}

/** Removes the JSON entries (dependencies, scripts, env, messages) of what's off. */
export async function editJson(answers: Answers): Promise<void> {
	const root = answers.directory;
	const off = removedManifests(answers);

	const dependencies = new Map<string, Set<string>>();
	const scripts = new Map<string, Set<string>>();
	for (const manifest of off) {
		for (const [file, names] of Object.entries(manifest.dependencies ?? {})) {
			dependencies.set(
				file,
				new Set([...(dependencies.get(file) ?? []), ...names]),
			);
		}
		for (const [file, names] of Object.entries(manifest.scripts ?? {})) {
			scripts.set(file, new Set([...(scripts.get(file) ?? []), ...names]));
		}
	}
	for (const file of new Set([...dependencies.keys(), ...scripts.keys()])) {
		const path = join(root, file);
		if (!(await exists(path))) {
			continue;
		}
		const json = await readJson(path);
		for (const field of [
			"dependencies",
			"devDependencies",
			"peerDependencies",
		]) {
			const deps = json[field] as Record<string, string> | undefined;
			for (const name of dependencies.get(file) ?? []) {
				const renamed = name.replace(/^@repo\//, `@${answers.slug}/`);
				delete deps?.[renamed];
			}
		}
		const scriptMap = json.scripts as Record<string, string> | undefined;
		for (const name of scripts.get(file) ?? []) {
			delete scriptMap?.[name];
		}
		await writeJson(path, json);
	}

	const rootJson = await readJson(join(root, "package.json"));
	rootJson.name = answers.slug;
	rootJson.description = answers.description;
	delete rootJson.license;
	await writeJson(join(root, "package.json"), rootJson);

	const turbo = await readJson(join(root, "turbo.json"));
	const build = (turbo.tasks as Record<string, { env?: string[] }>).build;
	const offEnv = new Set(off.flatMap((manifest) => manifest.turboEnv ?? []));
	if (build?.env) {
		build.env = build.env.filter((name) => !offEnv.has(name));
	}
	await writeJson(join(root, "turbo.json"), turbo);

	// Biome ignores paths that only the TurbineKit repository has.
	const biome = await readJson(join(root, "biome.json"));
	const files = biome.files as { includes?: string[] } | undefined;
	if (files?.includes) {
		files.includes = files.includes.filter((pattern) => {
			const path = pattern.replace(/^!/, "");
			return !TEMPLATE_ONLY.some(
				(only) => path === only || path.startsWith(`${only}/`),
			);
		});
	}
	await writeJson(join(root, "biome.json"), biome);

	const offMessages = off.flatMap((manifest) => manifest.messages ?? []);
	for (const locale of answers.locales) {
		const path = join(root, "apps/web/messages", `${locale}.json`);
		const messages = await readJson(path);
		for (const key of offMessages) {
			deletePath(messages, key);
		}
		const pages = messages.Pages as Record<string, Record<string, string>>;
		if (pages.home) {
			pages.home.description = answers.description;
		}
		await writeJson(path, messages);
	}
}

async function edit(
	path: string,
	change: (text: string) => string,
): Promise<void> {
	if (await exists(path)) {
		await writeFile(path, change(await readFile(path, "utf8")));
	}
}

/** `My App` → `ma_`: starts every API key, so people can tell them apart. */
export function apiKeyPrefix(name: string): string {
	const letters = name
		.split(/[^A-Za-z0-9]+/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toLowerCase())
		.join("")
		.replace(/[^a-z]/g, "");
	return `${(letters.length >= 2 ? letters : name.toLowerCase().replace(/[^a-z]/g, "")).slice(0, 3) || "ak"}_`;
}

/** The product's identity, languages and examples, written into the code. */
export async function personalize(answers: Answers): Promise<void> {
	const root = answers.directory;
	const q = JSON.stringify;

	await edit(join(root, "packages/site/src/index.ts"), (text) =>
		text
			.replace(/id: "[^"]*",/, `id: ${q(answers.slug)},`)
			.replace(/\bname: "TurbineKit",/, `name: ${q(answers.name)},`)
			.replace(
				/description:\s*"[^"]*",/,
				`description: ${q(answers.description)},`,
			)
			.replace(
				/name: "TurbineKit contributors",/,
				`name: ${q(answers.company)},`,
			)
			.replace(/email: "hello@turbinekit\.dev",/, `email: ${q(answers.email)},`)
			.replace(/links: \{[^}]*\},/, "links: {},")
			.replace(
				/apiKeyPrefix: "[^"]*",/,
				`apiKeyPrefix: ${q(apiKeyPrefix(answers.name))},`,
			),
	);

	const domain = answers.url ? new URL(answers.url).hostname : "example.com";
	await edit(join(root, ".env.example"), (text) =>
		text.replace(
			/^EMAIL_FROM=.*$/m,
			`EMAIL_FROM=${q(`${answers.name} <hello@mail.${domain}>`)}`,
		),
	);

	// Examples show the product's URL, name and API key prefix.
	const prefix = apiKeyPrefix(answers.name);
	const docs = join(root, "apps/docs/docs");
	if (await exists(docs)) {
		for (const file of await walk(docs)) {
			if (file.endsWith(".mdx")) {
				await edit(join(docs, file), (text) =>
					text
						.replaceAll(
							"https://example.com",
							answers.url ?? "https://example.com",
						)
						.replaceAll("my-app", answers.slug)
						.replaceAll("tk_", prefix),
				);
			}
		}
	}
	for (const file of [
		"SETUP.md",
		".agents/skills/turbinekit/references/api.md",
		".agents/skills/turbinekit/references/auth.md",
	]) {
		await edit(join(root, file), (text) => text.replaceAll("tk_", prefix));
	}

	await localize(answers);
}

/** Languages: the list, the default, and what a removed one leaves behind. */
async function localize(answers: Answers): Promise<void> {
	const root = answers.directory;
	const fr = answers.locales.includes("fr");

	await edit(join(root, "packages/i18n/src/index.ts"), (text) => {
		let next = text
			.replace(
				/export const locales = \[[^\]]*\] as const;/,
				`export const locales = [${answers.locales.map((code) => `"${code}"`).join(", ")}] as const;`,
			)
			.replace(
				/export const defaultLocale: Locale = "[^"]*";/,
				`export const defaultLocale: Locale = "${answers.defaultLocale}";`,
			);
		if (!fr) {
			next = next.replace(/^\s*fr: "[^"]*",\n/gm, "");
		}
		return next;
	});

	if (!fr) {
		await edit(join(root, "packages/email/src/strings/index.ts"), (text) =>
			text
				.replace(/^import \{ fr \} from "\.\/fr\.ts";\n/m, "")
				.replace("{ en, fr }", "{ en }"),
		);
		await edit(
			join(root, "apps/web/src/components/consent-manager.tsx"),
			(text) =>
				text
					.replace(
						/^import \{ translations as fr \} from "@c15t\/translations\/fr";\n/m,
						"",
					)
					.replace("{ en, fr }", "{ en }"),
		);
		await edit(join(root, "apps/docs/blume.config.ts"), (text) =>
			text.replace(/,\s*fr: "[^"]*"/g, ""),
		);
	}

	if (answers.defaultLocale !== "en") {
		await edit(join(root, "packages/db/src/schema/auth.ts"), (text) =>
			text.replace(
				'text("locale").default("en")',
				`text("locale").default("${answers.defaultLocale}")`,
			),
		);
		// Blume reads the default locale's pages at the content root.
		const docs = join(root, "apps/docs/docs");
		const own = join(docs, answers.defaultLocale);
		if (await exists(own)) {
			await mkdir(join(docs, "en"), { recursive: true });
			for (const entry of await readdir(docs)) {
				if (entry.endsWith(".mdx")) {
					await rename(join(docs, entry), join(docs, "en", entry));
				}
			}
			for (const entry of await readdir(own)) {
				await rename(join(own, entry), join(docs, entry));
			}
			await rm(own, { recursive: true });
		}
	}
}

/** A random secret for `.env.local`. */
function secret(): string {
	return randomBytes(32).toString("base64");
}

/** apps/web/.env.local, from .env.example, with fresh secrets. */
export async function writeLocalEnv(answers: Answers): Promise<void> {
	const root = answers.directory;
	const example = await readFile(join(root, ".env.example"), "utf8");
	const local = example
		.replace(/^BETTER_AUTH_SECRET=.*$/m, `BETTER_AUTH_SECRET=${secret()}`)
		.replace(/^CRON_SECRET=.*$/m, `CRON_SECRET=${secret()}`)
		// README starts with `pnpm db:local`; empty this with a real Postgres.
		.replace(/^DATABASE_POOL_MAX=.*$/m, "DATABASE_POOL_MAX=1");
	await writeFile(
		join(root, "apps/web/.env.local"),
		`# Local development only: never commit this file.\n${local}`,
	);
}

/** turbinekit.json: what the add-module skill needs to know. */
export async function writeManifest(
	answers: Answers,
	version: string,
): Promise<void> {
	await writeJson(join(answers.directory, "turbinekit.json"), {
		$comment:
			"Written by create-turbinekit. The add-module skill reads it to bring a module back at this version.",
		version,
		modules: answers.modules,
		providers: {
			email: answers.emailProvider,
			...(answers.modules.includes("files") && { files: answers.filesDriver }),
		},
		locales: answers.locales,
		defaultLocale: answers.defaultLocale,
		lint: answers.lint,
		skills: answers.skills,
	});
}

/** The project's README: how to start, and where things are. */
export async function writeReadme(answers: Answers): Promise<void> {
	const lines = [
		`# ${answers.name}`,
		"",
		answers.description,
		"",
		"## Start",
		"",
		"```sh",
		"pnpm db:local      # a local database, nothing to install (or: docker compose up -d)",
		"pnpm db:migrate    # in another terminal",
		"pnpm dev           # http://localhost:3000",
		"```",
		"",
		"`SETUP.md` covers each service; `LAUNCH.md` lists what to do before real",
		"users arrive. Agents: start with `AGENTS.md`.",
		"",
		"## Commands",
		"",
		"| Command | What it does |",
		"| --- | --- |",
		`| \`pnpm dev\` | The app on http://localhost:3000${answers.modules.includes("docs") ? ", the docs on :4321" : ""} |`,
		"| `pnpm lint` / `pnpm format` | Check / fix lint and formatting |",
		"| `pnpm typecheck` | TypeScript |",
		"| `pnpm test` | Tests (no database needed) |",
		"| `pnpm build` | A production build (no environment needed) |",
		"",
		"## Credits",
		"",
		"Built from [TurbineKit](https://github.com/turbinekit/turbinekit), MIT",
		"License, Copyright (c) TurbineKit contributors.",
		"",
	];
	await writeFile(join(answers.directory, "README.md"), lines.join("\n"));
}

/**
 * Rules where TurbineKit's code follows another convention than Ultracite:
 * the generated code passes, and new code follows Ultracite everywhere else.
 */
const ULTRACITE_EXCEPTIONS = {
	complexity: {
		noExcessiveCognitiveComplexity: "off",
		noRedundantDefaultExport: "off",
		noVoid: "off",
	},
	performance: {
		noAwaitInLoops: "off",
		noBarrelFile: "off",
		noJsxPropsBind: "off",
		noNamespaceImport: "off",
		useTopLevelRegex: "off",
	},
	style: {
		noExportedImports: "off",
		noIncrementDecrement: "off",
		noNestedTernary: "off",
		useConsistentMethodSignatures: "off",
		useConsistentTypeDefinitions: "off",
		useDestructuring: "off",
		useErrorCause: "off",
		useNamedCaptureGroup: "off",
		useUnicodeRegex: "off",
	},
	suspicious: {
		noAlert: "off",
		noEmptyBlockStatements: "off",
		noLeakedRender: "off",
		noShadow: "off",
		noUnnecessaryConditions: "off",
		useAwait: "off",
	},
};

/** The Ultracite setup: its presets, with the project's own rules on top. */
export async function applyUltracite(answers: Answers): Promise<void> {
	const root = answers.directory;
	const biome = await readJson(join(root, "biome.json"));
	biome.extends = [
		"ultracite/biome/core",
		"ultracite/biome/react",
		"ultracite/biome/next",
		"ultracite/biome/vitest",
		"ultracite/biome/drizzle",
	];
	delete biome.formatter;
	const javascript = biome.javascript as Record<string, unknown> | undefined;
	delete javascript?.formatter;
	const linter = (biome.linter ?? {}) as { rules?: Record<string, unknown> };
	const rules = (linter.rules ?? {}) as Record<string, Record<string, unknown>>;
	for (const [group, groupRules] of Object.entries(ULTRACITE_EXCEPTIONS)) {
		rules[group] = { ...(rules[group] ?? {}), ...groupRules };
	}
	linter.rules = rules;
	biome.linter = linter;
	await writeJson(join(root, "biome.json"), biome);
	const rootJson = await readJson(join(root, "package.json"));
	const dev = (rootJson.devDependencies ?? {}) as Record<string, string>;
	dev.ultracite = "8.1.0";
	rootJson.devDependencies = Object.fromEntries(
		Object.entries(dev).sort(([a], [b]) => a.localeCompare(b)),
	);
	await writeJson(join(root, "package.json"), rootJson);
}
