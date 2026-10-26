import { type Locale, locales } from "@repo/i18n";
import type { MetadataRoute } from "next";
import { languageAlternates, localizedPath } from "@/i18n/alternates";
import { legalSlugs, loadLegalPage } from "@/lib/legal";
import { absoluteUrl, pageUrl } from "@/lib/metadata";
import { publicPages } from "@/lib/routes";

/**
 * The public pages in every locale, with hreflang alternates, and the legal
 * pages in each locale that has its own copy. Everything else is behind
 * sign-in (see robots.ts).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const pages = publicPages.flatMap((page) =>
		locales.map((locale) => ({
			url: pageUrl(page.path, locale),
			changeFrequency: page.changeFrequency,
			priority: page.priority,
			alternates: { languages: languageAlternates(page.path, absoluteUrl) },
		})),
	);

	const legal = await Promise.all(
		legalSlugs.map(async (slug) => {
			const path = `/legal/${slug}`;
			const translated: Locale[] = [];
			for (const locale of locales) {
				if ((await loadLegalPage(slug, locale)).translated) {
					translated.push(locale);
				}
			}
			const languages = Object.fromEntries(
				translated.map((locale) => [
					locale,
					absoluteUrl(localizedPath(path, locale)),
				]),
			);
			return translated.map((locale) => ({
				url: pageUrl(path, locale),
				changeFrequency: "yearly" as const,
				priority: 0.3,
				alternates: translated.length > 1 ? { languages } : undefined,
			}));
		}),
	);

	return [...pages, ...legal.flat()];
}
