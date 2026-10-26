import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AdminTabs } from "@/components/admin/admin-tabs";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("Admin");
	return { title: t("title") };
}

/** Admins only: each page checks the role (requireAdmin) before any data. */
export default async function AdminLayout({
	children,
}: {
	children: ReactNode;
}) {
	const t = await getTranslations("Admin");
	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
			<AdminTabs />
			<div className="flex flex-col gap-6">{children}</div>
		</div>
	);
}
