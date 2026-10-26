/**
 * The marker engine. The template marks each module's code; this removes
 * what a project doesn't use and drops the markers from what it keeps.
 *
 *   // #region turbinekit:orgs        a block (`{/* … *\/}` in JSX and MDX,
 *   …                                 `<!-- … -->` in Markdown, `#` in env
 *   // #endregion turbinekit:orgs     and YAML files)
 *
 *   code(); // turbinekit:orgs        one line
 *
 * A condition is one id, `a|b` (any is on) or `a+b` (all are on). A `!`
 * before `turbinekit:` inverts it: the code stays only when the condition
 * is off. The template has every module on, so such code is written
 * commented out, and kept code is uncommented here.
 */

/** Every id a marker may use. `template` is never on in a project. */
export const MARKER_IDS = [
	"files",
	"files-s3",
	"files-blob",
	"docs",
	"analytics",
	"consent",
	"orgs",
	"admin",
	"payments",
	"resend",
	"email-sdk",
	// Languages other than English (packages/i18n).
	"fr",
	"es",
	"pt-BR",
	"de",
	"template",
] as const;

export type MarkerId = (typeof MARKER_IDS)[number];

export class MarkerError extends Error {
	constructor(file: string, line: number, message: string) {
		super(`${file}:${line}: ${message}`);
		this.name = "MarkerError";
	}
}

const OPEN = String.raw`(?:\/\/|#|\{\/\*|<!--)`;
const CONDITION = String.raw`(!?)turbinekit:([\w|+-]+)`;
const REGION_START = new RegExp(
	String.raw`^\s*${OPEN}\s*#region\s+${CONDITION}`,
);
const REGION_END = new RegExp(
	String.raw`^\s*(?:${OPEN}\s*)?#endregion\s+${CONDITION}`,
);
const LINE_MARKER = new RegExp(
	String.raw`\s*${OPEN}\s*${CONDITION}\s*(?:\*\/\}|-->)?\s*$`,
);

/** Whether a condition (`a`, `a|b`, `a+b`) holds for the enabled ids. */
export function holds(
	expression: string,
	enabled: ReadonlySet<string>,
	where = "",
): boolean {
	const any = expression.includes("|");
	const ids = expression.split(any ? "|" : "+");
	if (any && expression.includes("+")) {
		throw new Error(`${where}: mix "|" or "+", not both, in ${expression}`);
	}
	for (const id of ids) {
		if (!(MARKER_IDS as readonly string[]).includes(id)) {
			throw new Error(`${where}: unknown module "${id}" in ${expression}`);
		}
	}
	return any
		? ids.some((id) => enabled.has(id))
		: ids.every((id) => enabled.has(id));
}

/** How a kept line of a `!` block is uncommented, by file type. */
function uncommenter(file: string): (line: string) => string {
	if (/\.(md|mdx)$/.test(file)) {
		// The whole block sits in one comment, opened and closed on its markers.
		return (line) => line;
	}
	if (/(^|\/)(\.env[\w.]*|\.gitignore|[\w.-]+\.ya?ml)$/.test(file)) {
		return (line) => line.replace(/^(\s*)# ?/, "$1");
	}
	return (line) => line.replace(/^(\s*)\/\/ ?/, "$1");
}

type Region = {
	expression: string;
	negated: boolean;
	keep: boolean;
	line: number;
};

/**
 * Removes the code of disabled modules and every marker. Throws a
 * MarkerError on an unknown id or an unbalanced block.
 */
export function stripMarkers(
	text: string,
	enabled: ReadonlySet<string>,
	file = "<text>",
): string {
	const uncomment = uncommenter(file);
	const out: string[] = [];
	const stack: Region[] = [];
	const lines = text.split("\n");

	for (const [index, line] of lines.entries()) {
		const where = `${file}:${index + 1}`;
		const start = line.match(REGION_START);
		if (start) {
			const negated = start[1] === "!";
			const expression = start[2] ?? "";
			const on = holds(expression, enabled, where);
			stack.push({
				expression,
				negated,
				keep: stack.every((region) => region.keep) && on !== negated,
				line: index + 1,
			});
			continue;
		}
		const end = line.match(REGION_END);
		if (end) {
			const open = stack.pop();
			const closes = `${end[1]}turbinekit:${end[2]}`;
			if (!open) {
				throw new MarkerError(file, index + 1, `${closes} closes no block`);
			}
			const opened = `${open.negated ? "!" : ""}turbinekit:${open.expression}`;
			if (opened !== closes) {
				throw new MarkerError(
					file,
					index + 1,
					`${closes} closes ${opened} (line ${open.line})`,
				);
			}
			continue;
		}
		if (!stack.every((region) => region.keep)) {
			continue;
		}
		const kept = stack.some((region) => region.negated)
			? uncomment(line)
			: line;
		const marker = kept.match(LINE_MARKER);
		if (!marker) {
			out.push(kept);
			continue;
		}
		const negated = marker[1] === "!";
		if (holds(marker[2] ?? "", enabled, where) !== negated) {
			out.push(kept.slice(0, marker.index).trimEnd());
		}
	}

	const unclosed = stack.at(-1);
	if (unclosed) {
		throw new MarkerError(
			file,
			unclosed.line,
			`turbinekit:${unclosed.expression} is never closed`,
		);
	}
	return out.join("\n");
}

/** Whether a file may hold markers: text the engine knows how to read. */
export function isMarkable(file: string): boolean {
	return /\.(ts|tsx|js|mjs|cjs|md|mdx|css|ya?ml|sql)$|(^|\/)(\.env\.example|\.gitignore)$/.test(
		file,
	);
}
