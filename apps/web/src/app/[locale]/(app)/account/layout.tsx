import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AccountTabs } from "@/components/account/account-tabs";

export async function generateMetadata() {
	const t = await getTranslations("Account");
	return { title: t("title") };
}

export default async function AccountLayout({
	children,
}: {
	children: ReactNode;
}) {
	const t = await getTranslations("Account");
	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
			<AccountTabs />
			<div className="flex flex-col gap-6">{children}</div>
		</div>
	);
}
