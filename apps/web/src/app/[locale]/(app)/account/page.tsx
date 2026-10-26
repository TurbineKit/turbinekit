import { defaultLocale, isLocale } from "@repo/i18n";
import { Skeleton } from "@repo/ui/components/skeleton";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AvatarUpload } from "@/components/account/avatar-upload"; // turbinekit:files
import { DeleteAccount } from "@/components/account/delete-account";
import { ProfileForm } from "@/components/account/profile-form";
import { Section } from "@/components/account/section";
import { requireSession } from "@/lib/session";

export default async function ProfilePage() {
	const t = await getTranslations("Account");
	return (
		<>
			<Section
				title={t("profile.title")}
				description={t("profile.description")}
			>
				{/* #region turbinekit:files */}
				<div className="mb-6">
					<AvatarUpload />
				</div>
				{/* #endregion turbinekit:files */}
				<Suspense fallback={<Skeleton className="h-64" />}>
					<Profile />
				</Suspense>
			</Section>
			<Section title={t("danger.title")} description={t("danger.description")}>
				<DeleteAccount />
			</Section>
		</>
	);
}

async function Profile() {
	const { user } = await requireSession();
	const locale = isLocale(user.locale) ? user.locale : defaultLocale;
	return <ProfileForm user={{ name: user.name, email: user.email, locale }} />;
}
