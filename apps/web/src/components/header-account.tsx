"use client";

import { buttonVariants } from "@repo/ui/components/button";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/lib/auth-client";

/**
 * Sign in and sign up, or the way back to the dashboard. Public pages are
 * static, so the session is read in the browser.
 */
export function HeaderAccount() {
	const t = useTranslations("Nav");
	const { data, isPending } = useSession();

	if (isPending) {
		return <div className="hidden h-7 w-32 sm:block" />;
	}

	if (data) {
		return (
			<Link
				href="/dashboard"
				className={buttonVariants({
					size: "sm",
					className: "hidden sm:inline-flex",
				})}
			>
				{t("dashboard")}
			</Link>
		);
	}

	return (
		<div className="hidden items-center gap-1 sm:flex">
			<Link
				href="/sign-in"
				className={buttonVariants({ variant: "ghost", size: "sm" })}
			>
				{t("signIn")}
			</Link>
			<Link href="/sign-up" className={buttonVariants({ size: "sm" })}>
				{t("getStarted")}
			</Link>
		</div>
	);
}
