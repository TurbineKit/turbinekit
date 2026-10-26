import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

/**
 * Runs after `changeset version` (the root script `version-packages`): the
 * repository's `turbinekit.json` takes create-turbinekit's new version. Only
 * the version line changes, so the file keeps Biome's formatting.
 */
const repo = resolve(import.meta.dirname, "../../..");
const { version } = JSON.parse(
	await readFile(join(repo, "tooling/create/package.json"), "utf8"),
) as { version: string };
const path = join(repo, "turbinekit.json");
const manifest = await readFile(path, "utf8");
await writeFile(
	path,
	manifest.replace(/"version": "[^"]*"/, `"version": "${version}"`),
);
console.log(`turbinekit.json: ${version}`);
