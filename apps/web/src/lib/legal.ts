import { defaultLocale, type Locale } from "@repo/i18n";
import type { ComponentType } from "react";

/**
 * The legal pages, served at `/legal/<slug>`. Each is one MDX file per
 * locale in content/legal/<slug>/<locale>.mdx; a locale without its own copy
 * shows the default locale's, with a canonical URL pointing there.
 */
export const legalSlugs = ["privacy", "terms", "cookies"] as const;

export type LegalSlug = (typeof legalSlugs)[number];

export function isLegalSlug(value: string): value is LegalSlug {
	return (legalSlugs as readonly string[]).includes(value);
}

type LegalModule = { default: ComponentType; updated: string };

async function importLegal(
	slug: LegalSlug,
	locale: Locale,
): Promise<LegalModule | null> {
	try {
		return await import(`@/content/legal/${slug}/${locale}.mdx`);
	} catch {
		return null;
	}
}

export type LegalPage = {
	Content: ComponentType;
	/** ISO date the text last changed (the MDX file's `updated` export). */
	updated: string;
	/** False when the page shows the default locale's text. */
	translated: boolean;
};

export async function loadLegalPage(
	slug: LegalSlug,
	locale: Locale,
): Promise<LegalPage> {
	const own = await importLegal(slug, locale);
	if (own) {
		return { Content: own.default, updated: own.updated, translated: true };
	}
	const fallback = await importLegal(slug, defaultLocale);
	if (!fallback) {
		throw new Error(`content/legal/${slug}/${defaultLocale}.mdx is missing`);
	}
	return {
		Content: fallback.default,
		updated: fallback.updated,
		translated: locale === defaultLocale,
	};
}
