import type { Element, ElementContent, Root, RootContent } from "hast";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkGfm from "remark-gfm";
import remarkStringify from "remark-stringify";
import { unified } from "unified";

/**
 * Turns a rendered page into Markdown for language models and agents: the
 * page's `<main>`, with a front matter of its title, description, canonical
 * URL and language. scripts/build-markdown.ts runs it on every page in the
 * sitemap after `next build`.
 *
 * Left out: scripts, media, forms, navigation, anything hidden from
 * assistive technology (`aria-hidden`), and anything marked
 * `data-markdown="skip"` (interactive widgets that mean nothing as text).
 *
 * This file is run by Node directly, so it imports packages only.
 */

const DROPPED = new Set([
	"script",
	"style",
	"noscript",
	"template",
	"svg",
	"img",
	"picture",
	"video",
	"audio",
	"iframe",
	"canvas",
	"dialog",
	"form",
	"input",
	"select",
	"textarea",
	"button",
	"nav",
]);

const KEPT_EMPTY = new Set(["br", "hr", "td", "th", "tr"]);

const isElement = (node: RootContent | ElementContent): node is Element =>
	node.type === "element";

function find(
	node: Root | Element,
	test: (element: Element) => boolean,
): Element | undefined {
	for (const child of node.children) {
		if (!isElement(child)) {
			continue;
		}
		if (test(child)) {
			return child;
		}
		const match = find(child, test);
		if (match) {
			return match;
		}
	}
	return undefined;
}

function textOf(node: Element | undefined): string {
	return (node?.children ?? [])
		.map((child) => {
			if (child.type === "text") {
				return child.value;
			}
			return isElement(child) ? textOf(child) : "";
		})
		.join("");
}

function attribute(node: Element | undefined, name: string) {
	const value = node?.properties[name];
	return typeof value === "string" ? value : undefined;
}

const hasRel = (node: Element, rel: string) =>
	Array.isArray(node.properties.rel) && node.properties.rel.includes(rel);

const isDropped = (node: Element) =>
	DROPPED.has(node.tagName) ||
	node.properties.ariaHidden === "true" ||
	node.properties.dataMarkdown === "skip";

/** Removes what `isDropped` matches and what is left empty. */
function prune(node: Element): Element {
	const children = node.children.flatMap((child): ElementContent[] => {
		if (!isElement(child)) {
			return child.type === "comment" ? [] : [child];
		}
		if (isDropped(child)) {
			return [];
		}
		const kept = prune(child);
		return kept.children.length === 0 && !KEPT_EMPTY.has(kept.tagName)
			? []
			: [kept];
	});
	return { ...node, children };
}

/** Makes link targets absolute, so the Markdown works outside the site. */
function absolutize(node: Element, base: string): Element {
	const href = node.properties.href;
	return {
		...node,
		properties:
			node.tagName === "a" && typeof href === "string"
				? { ...node.properties, href: new URL(href, base).href }
				: node.properties,
		children: node.children.map((child) =>
			isElement(child) ? absolutize(child, base) : child,
		),
	};
}

/** A YAML string: JSON quoting is valid YAML. */
const yaml = (value: string) => JSON.stringify(value);

export async function pageToMarkdown(
	html: string,
	url: string,
): Promise<string> {
	const tree = unified().use(rehypeParse).parse(html);
	const canonical = attribute(
		find(tree, (node) => node.tagName === "link" && hasRel(node, "canonical")),
		"href",
	);
	const title = textOf(find(tree, (node) => node.tagName === "title")).trim();
	const description = attribute(
		find(
			tree,
			(node) =>
				node.tagName === "meta" && node.properties.name === "description",
		),
		"content",
	);
	const language = attribute(
		find(tree, (node) => node.tagName === "html"),
		"lang",
	);
	const main =
		find(tree, (node) => node.tagName === "main") ??
		find(tree, (node) => node.tagName === "body");

	const front = [
		"---",
		title && `title: ${yaml(title)}`,
		description && `description: ${yaml(description)}`,
		canonical && `url: ${canonical}`,
		language && `language: ${language}`,
		"---",
	].filter(Boolean);

	if (!main) {
		return `${front.join("\n")}\n`;
	}

	const content = absolutize(prune(main), canonical ?? url);
	const processor = unified()
		.use(rehypeRemark)
		.use(remarkGfm)
		.use(remarkStringify, { bullet: "-", emphasis: "_", rule: "-" });
	const mdast = await processor.run({ type: "root", children: [content] });
	const body = processor
		.stringify(mdast)
		.replace(/\n{3,}/g, "\n\n")
		.trim();
	return `${front.join("\n")}\n\n${body}\n`;
}
