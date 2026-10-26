import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { SocialSignIn } from "@/components/auth/social-sign-in";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("Auth.signUp");
	return { title: t("title") };
}

export default async function SignUpPage() {
	const t = await getTranslations("Auth.signUp");
	return (
		<AuthCard title={t("title")} description={t("description")}>
			<Suspense fallback={null}>
				<SocialSignIn />
			</Suspense>
			<SignUpForm />
		</AuthCard>
	);
}
