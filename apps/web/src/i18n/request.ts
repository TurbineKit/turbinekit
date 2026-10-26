import { locale as segmentLocale } from "next/root-params";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * Pages read the locale from the `[locale]` root param, so they stay static.
 * Route handlers can't read root params: they pass the locale they want
 * (`getTranslations({ locale, namespace })`), which arrives here as `locale`.
 */
export default getRequestConfig(async ({ locale: explicit }) => {
	const requested = explicit ?? (await segmentLocale());
	const locale = hasLocale(routing.locales, requested)
		? requested
		: routing.defaultLocale;
	return {
		locale,
		messages: (await import(`../../messages/${locale}.json`)).default,
	};
});
