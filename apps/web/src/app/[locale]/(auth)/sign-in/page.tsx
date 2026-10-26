import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/sign-in-form";
import { SocialSignIn } from "@/components/auth/social-sign-in";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("Auth.signIn");
	return { title: t("title") };
}

/** Also the login page of the OAuth server: MCP clients send users here. */
export default async function SignInPage() {
	const t = await getTranslations("Auth.signIn");
	return (
		<AuthCard title={t("title")} description={t("description")}>
			<Suspense fallback={null}>
				<SocialSignIn />
			</Suspense>
			<SignInForm />
		</AuthCard>
	);
}
