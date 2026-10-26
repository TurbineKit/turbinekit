import {
	type CompleteTranslations,
	enTranslations as en,
} from "@c15t/translations";
import { translations as de } from "@c15t/translations/de"; // turbinekit:de
import { translations as es } from "@c15t/translations/es"; // turbinekit:es
import { translations as fr } from "@c15t/translations/fr"; // turbinekit:fr
import { translations as pt } from "@c15t/translations/pt"; // turbinekit:pt-BR
import type { Locale } from "@repo/i18n";
import {
	ConsentBanner,
	ConsentDialog,
	ConsentRoot,
	ConsentTheme,
	defineTheme,
} from "c15t/next";
import { resolveConsent } from "c15t/next/server";
import type { ReactNode } from "react";
import { ConsentAnalytics } from "@/components/consent-analytics"; // turbinekit:analytics
import { getPathname } from "@/i18n/navigation";

/**
 * c15t's copy of the banner and dialog for each locale (packages/i18n).
 * Add an entry when you add a locale: c15t has most languages.
 */
const copy: Record<Locale, CompleteTranslations> = {
	en,
	// #region turbinekit:fr
	// c15t's French says "vous"; the site says "tu" (messages/fr.json).
	fr: {
		...fr,
		cookieBanner: {
			...fr.cookieBanner,
			title: "Nous respectons ta vie privée",
			description:
				"Ce site utilise des cookies pour améliorer ton expérience de navigation, analyser le trafic du site et afficher du contenu personnalisé.",
			noticeDescription:
				"Nous utilisons des cookies et des technologies similaires pour faire fonctionner ce site, mesurer le trafic et personnaliser le contenu et les publicités. Tu peux te désinscrire ou gérer tes préférences à tout moment.",
		},
		consentManagerDialog: {
			...fr.consentManagerDialog,
			description:
				"Personnalise tes paramètres de confidentialité ici. Tu peux choisir les types de cookies et de technologies de suivi que tu autorises.",
		},
	},
	// #endregion turbinekit:fr
	es, // turbinekit:es
	"pt-BR": pt, // turbinekit:pt-BR
	de, // turbinekit:de
};

/** The site's tokens (packages/ui) flip under .dark, so one set serves both. */
const colors = {
	primary: "var(--primary)",
	primaryHover: "color-mix(in oklab, var(--primary) 90%, var(--background))",
	textOnPrimary: "var(--primary-foreground)",
	surface: "var(--popover)",
	surfaceHover: "var(--muted)",
	border: "var(--border)",
	borderHover: "var(--ring)",
	text: "var(--popover-foreground)",
	textMuted: "var(--muted-foreground)",
	switchTrackActive: "var(--primary)",
};

const theme = defineTheme({
	colors,
	dark: colors,
	// Set by next/font on <html>.
	typography: {
		fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
	},
	radius: {
		sm: "calc(var(--radius) * 0.6)",
		md: "calc(var(--radius) * 0.8)",
		lg: "var(--radius)",
	},
});

/**
 * The consent banner and the preference dialog (rules: c15t.config.ts).
 * resolveConsent() is not awaited: the page stays in the static shell, and
 * the visitor's state streams in with the response.
 */
export function ConsentManager({
	locale,
	children,
}: {
	locale: Locale;
	children: ReactNode;
}) {
	const link = (href: string) => ({
		href: getPathname({ href, locale }),
		target: "_self" as const,
	});

	return (
		<>
			<ConsentTheme theme={theme} />
			<ConsentRoot
				state={resolveConsent({ language: locale })}
				options={{
					// Offline, c15t takes the language from here, not from the request.
					i18n: { locale, messages: { [locale]: copy[locale] } },
					legalLinks: {
						privacyPolicy: link("/legal/privacy"),
						cookiePolicy: link("/legal/cookies"),
						termsOfService: link("/legal/terms"),
					},
				}}
			>
				{children}
				<ConsentBanner
					legalLinks={["privacyPolicy", "cookiePolicy"]}
					hideBranding
				/>
				<ConsentDialog hideBranding />
				{/* #region turbinekit:analytics */}
				<ConsentAnalytics />
				{/* #endregion turbinekit:analytics */}
			</ConsentRoot>
		</>
	);
}
