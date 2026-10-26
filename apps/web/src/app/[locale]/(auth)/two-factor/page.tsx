import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/auth/auth-card";
import { TwoFactorForm } from "@/components/auth/two-factor-form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("Auth.twoFactor");
	return { title: t("title") };
}

export default async function TwoFactorPage() {
	const t = await getTranslations("Auth.twoFactor");
	return (
		<AuthCard title={t("title")}>
			<TwoFactorForm />
		</AuthCard>
	);
}
