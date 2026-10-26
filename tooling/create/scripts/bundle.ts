import {
	copyFile,
	lstat,
	mkdir,
	readlink,
	rm,
	writeFile,
} from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { templateFiles } from "../src/generate.ts";
import {
	EMAIL_PROVIDERS,
	FILES_DRIVERS,
	MODULES,
	PAIRS,
	TEMPLATE_ONLY,
} from "../src/modules.ts";

/**
 * Copies the repository into `template/` for the npm package, and writes
 * `modules.json` (read by the add-module skill). npm would drop or rename
 * some files, so `.gitignore` files ship as `_gitignore` and symlinks as a
 * list in `_symlinks.json`; the generator puts both back.
 */
const pkg = resolve(import.meta.dirname, "..");
const repo = resolve(pkg, "../..");
const out = join(pkg, "template");

await rm(out, { recursive: true, force: true });
const symlinks: Record<string, string> = {};
let count = 0;
for (const file of await templateFiles({ root: repo, kind: "checkout" })) {
	if (
		TEMPLATE_ONLY.some((path) => file === path || file.startsWith(`${path}/`))
	) {
		continue;
	}
	const from = join(repo, file);
	if ((await lstat(from)).isSymbolicLink()) {
		symlinks[file] = await readlink(from);
		continue;
	}
	const name = basename(file) === ".gitignore" ? "_gitignore" : basename(file);
	const to = join(out, dirname(file), name);
	await mkdir(dirname(to), { recursive: true });
	await copyFile(from, to);
	count++;
}
await writeFile(
	join(out, "_symlinks.json"),
	`${JSON.stringify(symlinks, null, "\t")}\n`,
);
await writeFile(
	join(pkg, "modules.json"),
	`${JSON.stringify(
		{
			modules: MODULES,
			emailProviders: EMAIL_PROVIDERS,
			filesDrivers: FILES_DRIVERS,
			pairs: PAIRS,
		},
		null,
		"\t",
	)}\n`,
);
console.log(
	`template: ${count} files, ${Object.keys(symlinks).length} symlinks`,
);
