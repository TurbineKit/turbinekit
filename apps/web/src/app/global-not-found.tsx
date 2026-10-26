import { defaultLocale } from "@repo/i18n";
import { site } from "@repo/site";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations({
		locale: defaultLocale,
		namespace: "NotFound",
	});
	return { title: `${t("title")} · ${site.name}`, robots: { index: false } };
}

/**
 * URLs that match no route at all (outside every locale, like /api/nope).
 * Rendered without the root layout, so it brings its own <html>.
 */
export default async function GlobalNotFound() {
	const t = await getTranslations({
		locale: defaultLocale,
		namespace: "NotFound",
	});
	return (
		<html lang={defaultLocale} className={GeistSans.variable}>
			<body className="font-sans antialiased">
				<main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
					<p className="font-mono text-sm text-muted-foreground">404</p>
					<h1 className="text-3xl font-semibold tracking-tight">
						{t("title")}
					</h1>
					<p className="text-muted-foreground">{t("body")}</p>
					<a href="/" className="underline underline-offset-4">
						{t("home")}
					</a>
				</main>
			</body>
		</html>
	);
}
