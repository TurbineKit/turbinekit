/**
 * The site's languages. The default one lives at bare paths (`/pricing`), the
 * others under a prefix (`/fr/pricing`). create-turbinekit writes this list
 * from the locales you pick. To add one later, follow the add-locale skill.
 */
export const locales = ["en", "fr", "es", "pt-BR", "de"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Each language in its own words, as the language switcher lists it. */
export const localeNames: Record<Locale, string> = {
	en: "English",
	fr: "Français", // turbinekit:fr
	es: "Español", // turbinekit:es
	"pt-BR": "Português (Brasil)", // turbinekit:pt-BR
	de: "Deutsch", // turbinekit:de
};

/** Open Graph locale codes (`og:locale`). */
export const ogLocales: Record<Locale, string> = {
	en: "en_US",
	fr: "fr_FR", // turbinekit:fr
	es: "es_ES", // turbinekit:es
	"pt-BR": "pt_BR", // turbinekit:pt-BR
	de: "de_DE", // turbinekit:de
};

export function isLocale(value: unknown): value is Locale {
	return (
		typeof value === "string" && (locales as readonly string[]).includes(value)
	);
}
