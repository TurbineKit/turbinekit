// Writes a Markdown copy of every page in the sitemap to public/, right after
// `next build`: each page's prerendered HTML, converted by src/lib/markdown.ts.
// They are served as static files at the page's URL plus .md, so agents read
// clean text instead of HTML. Every .md in public/ is generated and ignored by
// git: the last build's copies are removed first.
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { defaultLocale, isLocale } from "@repo/i18n";
import { pageToMarkdown } from "../src/lib/markdown.ts";
import { markdownPath } from "../src/lib/markdown-path.ts";

const started = performance.now();
const serverDir = join(process.cwd(), ".next/server");
const publicDir = join(process.cwd(), "public");

/**
 * The files `next build` prerendered, by path. Without a build adapter they
 * sit in .next/server/app; with one (on Vercel) in
 * .next/server/route-cache/<kind>/<hash>/$ plus that path.
 */
const prerendered = new Map<string, string>();
for (const file of await readdir(join(serverDir, "app"), { recursive: true })) {
	prerendered.set(`/${file}`, join(serverDir, "app", file));
}
for (const file of await readdir(join(serverDir, "route-cache"), {
	recursive: true,
}).catch(() => [])) {
	const path = file.match(/^[^/]+\/[^/]+\/\$(\/.+)$/)?.[1];
	if (path) {
		prerendered.set(path, join(serverDir, "route-cache", file));
	}
}

/** `/fr/pricing` → `/fr/pricing.html`, `/` → `/en.html` (default locale). */
function htmlFile(pathname: string) {
	const segments = pathname.split("/").filter(Boolean);
	const locale = isLocale(segments[0]) ? segments.shift() : defaultLocale;
	return prerendered.get(`/${[locale, ...segments].join("/")}.html`);
}

await mkdir(publicDir, { recursive: true });
for (const file of await readdir(publicDir, { recursive: true })) {
	if (file.endsWith(".md")) {
		await rm(join(publicDir, file));
	}
}

const sitemapFile = prerendered.get("/sitemap.xml.body");
if (sitemapFile === undefined) {
	throw new Error("Markdown: no prerendered /sitemap.xml in .next/server");
}
const sitemap = await readFile(sitemapFile, "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
	(match) => match[1] as string,
);

const missing: string[] = [];
for (const url of urls) {
	const { pathname } = new URL(url);
	const file = htmlFile(pathname);
	const html = file ? await readFile(file, "utf8").catch(() => null) : null;
	if (html === null) {
		missing.push(pathname);
		continue;
	}
	const target = join(publicDir, markdownPath(pathname));
	await mkdir(dirname(target), { recursive: true });
	await writeFile(target, await pageToMarkdown(html, url));
}

const written = urls.length - missing.length;
const seconds = ((performance.now() - started) / 1000).toFixed(1);
console.log(
	`Markdown: wrote ${written} copies of ${urls.length} sitemap pages in ${seconds}s`,
);
if (missing.length > 0) {
	console.warn(
		`Markdown: no prerendered HTML, so no copy, for:\n  ${missing.join("\n  ")}`,
	);
}
