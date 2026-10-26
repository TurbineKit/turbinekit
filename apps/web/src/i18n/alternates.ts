import { defaultLocale, type Locale, locales } from "@repo/i18n";
import { getPathname } from "./navigation";

/** A path in a locale: `/about` → `/about` (default) or `/fr/about`. */
export function localizedPath(path: string, locale: Locale): string {
	return getPathname({ href: path, locale });
}

/** hreflang alternates for a page that exists in every locale. */
export function languageAlternates(
	path: string,
	toUrl: (path: string) => string,
): Record<string, string> {
	return {
		...Object.fromEntries(
			locales.map((locale) => [locale, toUrl(localizedPath(path, locale))]),
		),
		"x-default": toUrl(localizedPath(path, defaultLocale)),
	};
}
