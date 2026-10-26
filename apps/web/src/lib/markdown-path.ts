import { isLocale } from "@repo/i18n";

/**
 * Where a page's Markdown copy is served: the page's path plus `.md`, and
 * `index.md` for a home page (`/` → `/index.md`, `/fr` → `/fr/index.md`,
 * `/fr/pricing` → `/fr/pricing.md`).
 */
export function markdownPath(pathname: string): string {
	const path = pathname.replace(/\/+$/, "");
	return path === "" || isLocale(path.slice(1))
		? `${path}/index.md`
		: `${path}.md`;
}
