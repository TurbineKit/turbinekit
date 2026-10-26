import { buttonVariants } from "@repo/ui/components/button";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata() {
	const t = await getTranslations("NotFound");
	return { title: t("title"), robots: { index: false } };
}

/** Unknown addresses under a locale, and every `notFound()`. */
export default async function NotFound() {
	const t = await getTranslations("NotFound");
	return (
		<main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
			<p className="font-mono text-sm text-muted-foreground">404</p>
			<h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
			<p className="text-muted-foreground">{t("body")}</p>
			<Link href="/" className={buttonVariants()}>
				{t("home")}
			</Link>
		</main>
	);
}
