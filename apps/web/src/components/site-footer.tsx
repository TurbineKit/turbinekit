import { site } from "@repo/site";
import { ConsentDialogLink } from "c15t/next"; // turbinekit:consent
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/** The footer's year. A static page keeps the year it was built in. */
const year = new Date().getFullYear();

export async function SiteFooter() {
	const t = await getTranslations("Footer");

	return (
		<footer className="border-t">
			<div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-muted-foreground md:flex-row md:justify-between">
				<p>{t("copyright", { year, company: site.company.name })}</p>
				<nav aria-label={t("legal")} className="flex flex-wrap gap-x-5 gap-y-2">
					<Link href="/legal/privacy" className="hover:text-foreground">
						{t("privacy")}
					</Link>
					<Link href="/legal/terms" className="hover:text-foreground">
						{t("terms")}
					</Link>
					<Link href="/legal/cookies" className="hover:text-foreground">
						{t("cookies")}
					</Link>
					{/* #region turbinekit:consent */}
					<ConsentDialogLink className="cursor-pointer hover:text-foreground">
						{t("cookieSettings")}
					</ConsentDialogLink>
					{/* #endregion turbinekit:consent */}
					<a href="/llms.txt" className="hover:text-foreground">
						{t("agents")}
					</a>
				</nav>
			</div>
		</footer>
	);
}
