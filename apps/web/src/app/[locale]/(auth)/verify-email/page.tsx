import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/auth/auth-card";
import { VerifyEmailNotice } from "@/components/auth/verify-email-notice";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("Auth.verify");
	return { title: t("title") };
}

export default async function VerifyEmailPage() {
	const t = await getTranslations("Auth.verify");
	return (
		<AuthCard title={t("title")}>
			<VerifyEmailNotice />
		</AuthCard>
	);
}
