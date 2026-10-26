import { defaultLocale, locales } from "@repo/i18n";
import { defineRouting } from "next-intl/routing";

/**
 * The default locale lives at bare paths (`/pricing`), the others under a
 * prefix (`/fr/pricing`). A first visit goes to the language the browser asks
 * for; a choice in the switcher is kept in the NEXT_LOCALE cookie for a year.
 * The locales themselves are in packages/i18n.
 */
export const routing = defineRouting({
	locales,
	defaultLocale,
	localePrefix: "as-needed",
	localeCookie: { maxAge: 60 * 60 * 24 * 365 },
});
