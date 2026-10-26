import { defaultLocale, isLocale, type Locale } from "@repo/i18n";
import { site } from "@repo/site";
import { de } from "./de.ts"; // turbinekit:de
import { type EmailStrings, en } from "./en.ts";
import { es } from "./es.ts"; // turbinekit:es
import { fr } from "./fr.ts"; // turbinekit:fr
import { ptBR } from "./pt-BR.ts"; // turbinekit:pt-BR

const catalogs: Record<Locale, EmailStrings> = {
	en,
	fr, // turbinekit:fr
	es, // turbinekit:es
	"pt-BR": ptBR, // turbinekit:pt-BR
	de, // turbinekit:de
};

/** The email text in a locale; unknown locales get the default one. */
export function strings(locale: string | null | undefined): EmailStrings {
	return catalogs[isLocale(locale) ? locale : defaultLocale];
}

/** Fills `{placeholders}`. `{product}` is always the site's name. */
export function fill(
	text: string,
	values: Record<string, string | number> = {},
): string {
	const all: Record<string, string | number> = {
		product: site.name,
		...values,
	};
	return text.replace(/\{(\w+)\}/g, (match, key: string) =>
		key in all ? String(all[key]) : match,
	);
}

export type { EmailStrings };
