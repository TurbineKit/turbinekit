import { defaultLocale, type Locale, ogLocales } from "@repo/i18n";
import { site, siteUrl } from "@repo/site";
import type { Metadata } from "next";
import { languageAlternates, localizedPath } from "@/i18n/alternates";
import { markdownPath } from "@/lib/markdown-path";
import { ogImagePath } from "@/lib/og";

/** An absolute URL on this site. */
export function absoluteUrl(path: string): string {
	return new URL(path, siteUrl()).href;
}

/** A page's absolute URL in a locale: `('/pricing', 'fr')` → `https://…/fr/pricing`. */
export function pageUrl(path: string, locale: Locale = defaultLocale): string {
	return absoluteUrl(localizedPath(path, locale));
}

/** The Markdown copy of a page (scripts/build-markdown.ts writes it). */
export function markdownUrl(
	path: string,
	locale: Locale = defaultLocale,
): string {
	return absoluteUrl(markdownPath(localizedPath(path, locale)));
}

type MetadataInput = {
	title: string;
	description: string;
	/** Page path without the locale prefix, for example `/pricing`. */
	path: string;
	locale: Locale;
	/**
	 * False when the page has no copy in this locale yet (a legal page shown
	 * in English): the canonical URL then points at the default locale.
	 */
	translated?: boolean;
	/** Use the title as is, without the " · Site" template (home page). */
	absoluteTitle?: boolean;
	type?: "website" | "article";
};

/**
 * Metadata for a public page: canonical URL, hreflang alternates, the
 * Markdown copy, and a share card drawn by /api/og. Signed-in and auth
 * pages don't use it: their layouts set noindex.
 */
export function createMetadata({
	title,
	description,
	path,
	locale,
	translated = true,
	absoluteTitle = false,
	type = "website",
}: MetadataInput): Metadata {
	const servedLocale = translated ? locale : defaultLocale;
	const canonical = pageUrl(path, servedLocale);
	const image = absoluteUrl(ogImagePath(title, description));

	return {
		title: absoluteTitle ? { absolute: title } : title,
		description,
		alternates: {
			canonical,
			languages: translated ? languageAlternates(path, absoluteUrl) : undefined,
			types: { "text/markdown": markdownUrl(path, servedLocale) },
		},
		openGraph: {
			title,
			description,
			type,
			url: canonical,
			siteName: site.name,
			locale: ogLocales[locale],
			images: [{ url: image, width: 1200, height: 630, alt: title }],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: [image],
		},
	};
}

/** Metadata for pages that search engines must not index. */
export function privateMetadata(title: string): Metadata {
	return { title, robots: { index: false, follow: false } };
}

const organizationId = () => `${absoluteUrl("/")}#organization`;
const websiteId = () => `${absoluteUrl("/")}#website`;

/** schema.org Organization and WebSite, on every page (root layout). */
export function siteSchema(locale: Locale) {
	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "Organization",
				"@id": organizationId(),
				name: site.name,
				url: absoluteUrl("/"),
				email: site.company.email,
				sameAs: Object.values(site.links),
			},
			{
				"@type": "WebSite",
				"@id": websiteId(),
				name: site.name,
				description: site.description,
				url: absoluteUrl("/"),
				inLanguage: locale,
				publisher: { "@id": organizationId() },
			},
		],
	};
}

/** schema.org WebPage for a public page. */
export function webPageSchema({
	path,
	locale,
	name,
	description,
}: {
	path: string;
	locale: Locale;
	name: string;
	description?: string;
}) {
	const url = pageUrl(path, locale);
	return {
		"@context": "https://schema.org",
		"@type": "WebPage",
		"@id": url,
		url,
		name,
		...(description && { description }),
		inLanguage: locale,
		isPartOf: { "@id": websiteId() },
		publisher: { "@id": organizationId() },
	};
}

/** schema.org BreadcrumbList from `[name, path]` pairs, home first. */
export function breadcrumbSchema(
	items: [name: string, path: string][],
	locale: Locale,
) {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map(([name, path], index) => ({
			"@type": "ListItem",
			position: index + 1,
			name,
			item: pageUrl(path, locale),
		})),
	};
}
