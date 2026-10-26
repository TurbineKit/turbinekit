import { getTranslations } from "next-intl/server";
import { ChangePassword } from "@/components/account/change-password";
import { Passkeys } from "@/components/account/passkeys";
import { Section } from "@/components/account/section";
import { Sessions } from "@/components/account/sessions";
import { TwoFactor } from "@/components/account/two-factor";

export default async function SecurityPage() {
	const t = await getTranslations("Account");
	return (
		<>
			<Section
				title={t("password.title")}
				description={t("password.description")}
			>
				<ChangePassword />
			</Section>
			<Section
				title={t("passkeys.title")}
				description={t("passkeys.description")}
			>
				<Passkeys />
			</Section>
			<Section
				title={t("twoFactor.title")}
				description={t("twoFactor.description")}
			>
				<TwoFactor />
			</Section>
			<Section
				title={t("sessions.title")}
				description={t("sessions.description")}
			>
				<Sessions />
			</Section>
		</>
	);
}
