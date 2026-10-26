#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as p from "@clack/prompts";
import color from "picocolors";
import { finishSteps, type StepResult } from "./finish.ts";
import {
	applyUltracite,
	copyTemplate,
	editJson,
	personalize,
	type Source,
	writeLocalEnv,
	writeManifest,
	writeReadme,
} from "./generate.ts";
import { type Answers, answersFromFlags, HELP, parseFlags } from "./options.ts";
import { ask, summary } from "./prompts.ts";

async function version(): Promise<string> {
	const pkg = JSON.parse(
		await readFile(new URL("../package.json", import.meta.url), "utf8"),
	) as { version: string };
	return pkg.version;
}

/** A path as one shell word: quoted when it has spaces or symbols. */
function shellWord(path: string): string {
	return /^[\w@%+=:,./-]+$/.test(path)
		? path
		: `'${path.replaceAll("'", `'\\''`)}'`;
}

async function isEmptyDirectory(path: string): Promise<boolean> {
	const entries = await readdir(path).catch(() => null);
	return entries === null || entries.length === 0;
}

async function create(
	answers: Answers,
	source: Source,
	quiet: boolean,
): Promise<StepResult[]> {
	const results: StepResult[] = [];
	const spin = quiet ? null : p.spinner();

	spin?.start("Writing the project");
	const files = await copyTemplate(source, answers);
	await editJson(answers);
	await personalize(answers);
	if (answers.lint === "ultracite") {
		await applyUltracite(answers);
	}
	await writeLocalEnv(answers);
	await writeManifest(answers, await version());
	await writeReadme(answers);
	spin?.stop(`Wrote ${files} files`);
	results.push({
		step: "Writing the project",
		ok: true,
		detail: `${files} files`,
	});

	for (const step of finishSteps(answers)) {
		spin?.start(step.title);
		const result = await step.run();
		results.push(result);
		if (result.ok) {
			spin?.stop(step.title);
		} else {
			spin?.error(`${step.title}: ${color.yellow("skipped")}`);
			if (!quiet && result.detail) {
				p.log.warn(result.detail);
			}
		}
	}
	return results;
}

async function main(): Promise<void> {
	const flags = parseFlags(process.argv.slice(2));
	if (flags.help) {
		console.log(HELP);
		return;
	}
	if (flags.version) {
		console.log(await version());
		return;
	}

	const quiet = Boolean(flags.json);
	const interactive =
		!(flags.yes || quiet) && process.stdin.isTTY && process.stdout.isTTY;
	const defaults = answersFromFlags(flags);
	if (!quiet) {
		p.intro(color.inverse(" create-turbinekit "));
	}
	const answers = interactive ? await ask(flags, defaults) : defaults;
	if (!interactive && !quiet) {
		p.note(summary(answers), "The project");
	}

	if (!(await isEmptyDirectory(answers.directory))) {
		throw new Error(`${answers.directory} exists and is not empty.`);
	}
	const source: Source = flags.template
		? { root: resolve(flags.template), kind: "checkout" }
		: {
				root: fileURLToPath(new URL("../template", import.meta.url)),
				kind: "bundle",
			};

	const results = await create(answers, source, quiet);
	if (quiet) {
		console.log(JSON.stringify({ ok: true, answers, results }, null, 2));
		return;
	}

	p.note(
		[
			`cd ${shellWord(answers.directory)}`,
			...(answers.install ? [] : ["pnpm install"]),
			"pnpm db:local       # or: docker compose up -d",
			"pnpm db:migrate     # in another terminal",
			"pnpm dev",
		].join("\n"),
		"Next",
	);
	p.outro(
		`Then open ${color.cyan("SETUP.md")}. Agents start with ${color.cyan("AGENTS.md")}.`,
	);
}

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	if (process.argv.includes("--json")) {
		console.log(JSON.stringify({ ok: false, error: message }, null, 2));
	} else {
		p.cancel(message);
	}
	process.exit(1);
});
