import { isLocale, locales } from "@repo/i18n";
import { site, siteUrl } from "@repo/site";
import { Toaster } from "@repo/ui/components/sonner";
import { TooltipProvider } from "@repo/ui/components/tooltip";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { ConsentManager } from "@/components/consent-manager"; // turbinekit:consent
import { JsonLd } from "@/components/json-ld";
import { ThemeProvider } from "@/components/theme-provider";
import { clientMessages } from "@/lib/client-messages";
import { siteSchema } from "@/lib/metadata";
import { ogImagePath } from "@/lib/og";
import "../globals.css";

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl()),
	title: { default: site.name, template: `%s · ${site.name}` },
	description: site.description,
	applicationName: site.name,
	openGraph: {
		type: "website",
		siteName: site.name,
		images: [
			{
				url: ogImagePath(site.name, site.description),
				width: 1200,
				height: 630,
			},
		],
	},
	twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
	],
};

/** Every locale is rendered at build time, so public pages stay static. */
export function generateStaticParams() {
	return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
	children,
}: {
	children: ReactNode;
}) {
	const locale = await rootLocale();
	if (!isLocale(locale)) {
		notFound();
	}
	const messages = await getMessages();

	return (
		<html
			lang={locale}
			className={`${GeistSans.variable} ${GeistMono.variable}`}
			suppressHydrationWarning
		>
			<body className="min-h-dvh font-sans antialiased">
				<JsonLd data={siteSchema(locale)} />
				<NextIntlClientProvider messages={clientMessages(messages)}>
					<ThemeProvider>
						<TooltipProvider>
							{/* #region turbinekit:consent */}
							<ConsentManager locale={locale}>
								{/* #endregion turbinekit:consent */}
								{children}
								<Toaster />
								{/* #region turbinekit:consent */}
							</ConsentManager>
							{/* #endregion turbinekit:consent */}
						</TooltipProvider>
					</ThemeProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
