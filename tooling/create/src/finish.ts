import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import type { Answers } from "./options.ts";
import { installCommands } from "./skills.ts";

export type StepResult = { step: string; ok: boolean; detail?: string };

/** Runs a command in the project; resolves with its exit status and output. */
function run(
	command: string,
	args: string[],
	cwd: string,
): Promise<{ ok: boolean; output: string }> {
	return new Promise((resolve) => {
		const child = spawn(command, args, {
			cwd,
			env: { ...process.env, CI: process.env.CI ?? "1" },
			stdio: ["ignore", "pipe", "pipe"],
		});
		let output = "";
		child.stdout.on("data", (chunk: Buffer) => {
			output += chunk.toString();
		});
		child.stderr.on("data", (chunk: Buffer) => {
			output += chunk.toString();
		});
		child.on("error", (error) => resolve({ ok: false, output: String(error) }));
		child.on("close", (code) => resolve({ ok: code === 0, output }));
	});
}

/** The last lines of a command's output: enough to see what failed. */
function tail(output: string): string {
	return output.trim().split("\n").slice(-12).join("\n");
}

export type Step = { title: string; run: () => Promise<StepResult> };

/** What happens after the files are written, in order. */
export function finishSteps(answers: Answers): Step[] {
	const cwd = answers.directory;
	const steps: Step[] = [];
	const step = (
		title: string,
		command: string,
		args: string[],
		required = true,
	): Step => ({
		title,
		run: async () => {
			const result = await run(command, args, cwd);
			if (!result.ok && required) {
				throw new Error(`${title} failed:\n${tail(result.output)}`);
			}
			return {
				step: title,
				ok: result.ok,
				...(!result.ok && { detail: tail(result.output) }),
			};
		},
	});

	if (answers.install) {
		steps.push(
			step("Installing dependencies", "pnpm", [
				"install",
				"--no-frozen-lockfile",
			]),
		);
		// Code of removed modules can leave imports unused; Biome only drops
		// those with --unsafe, so this runs on that one rule alone.
		steps.push(
			step(
				"Removing unused imports",
				"pnpm",
				[
					"exec",
					"biome",
					"lint",
					"--write",
					"--unsafe",
					"--only=correctness/noUnusedImports",
				],
				false,
			),
		);
		steps.push(
			step("Formatting", "pnpm", ["exec", "biome", "check", "--write"], false),
		);
		steps.push({
			title: "Writing the first migration",
			run: async () => {
				// The template's migrations include every module's tables: one
				// fresh migration matches the modules this project has.
				await rm(join(cwd, "packages/db/drizzle"), {
					recursive: true,
					force: true,
				});
				const result = await run(
					"pnpm",
					[
						"--filter",
						`@${answers.slug}/db`,
						"exec",
						"drizzle-kit",
						"generate",
						"--name",
						"init",
					],
					cwd,
				);
				if (!result.ok) {
					throw new Error(`The migration failed:\n${tail(result.output)}`);
				}
				return { step: "Writing the first migration", ok: true };
			},
		});
	}

	for (const args of installCommands(answers.skills)) {
		const source = args[3] ?? "";
		steps.push(step(`Installing skills from ${source}`, "npx", args, false));
	}

	if (answers.git) {
		steps.push({
			title: "Creating the git repository",
			run: async () => {
				const init = await run("git", ["init", "-q", "-b", "main"], cwd);
				const add = init.ok ? await run("git", ["add", "-A"], cwd) : init;
				const commit = add.ok
					? await run(
							"git",
							["commit", "-q", "-m", "Initial commit from create-turbinekit"],
							cwd,
						)
					: add;
				const ok = commit.ok;
				return {
					step: "Creating the git repository",
					ok,
					...(!ok && {
						detail:
							"The repository exists, but nothing is committed: set your git name and email, then commit.",
					}),
				};
			},
		});
	}
	return steps;
}
