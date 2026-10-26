/**
 * The site's languages. The default one lives at bare paths (`/pricing`), the
 * others under a prefix (`/fr/pricing`). create-turbinekit writes this list
 * from the locales you pick. To add one later, follow the add-locale skill.
 */
export const locales = ["en", "fr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Each language in its own words, as the language switcher lists it. */
export const localeNames: Record<Locale, string> = {
	en: "English",
	fr: "Français",
};

/** Open Graph locale codes (`og:locale`). */
export const ogLocales: Record<Locale, string> = {
	en: "en_US",
	fr: "fr_FR",
};

export function isLocale(value: unknown): value is Locale {
	return (
		typeof value === "string" && (locales as readonly string[]).includes(value)
	);
}
