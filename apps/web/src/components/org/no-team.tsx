"use client";

import { Button } from "@repo/ui/components/button";
import { UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Section } from "@/components/account/section";
import { CreateTeamForm } from "@/components/org/create-team-form";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

/** The personal space: the user's teams, and a way to create one. */
export function NoTeam({ teams }: { teams: { id: string; name: string }[] }) {
	const t = useTranslations("Org");
	const router = useRouter();

	return (
		<>
			<Section title={t("none.title")} description={t("none.body")}>
				{teams.length > 0 && (
					<div className="flex flex-col gap-2">
						<p className="text-sm font-medium">{t("none.teams")}</p>
						<ul className="divide-y rounded-lg border">
							{teams.map((team) => (
								<li key={team.id} className="flex items-center gap-3 px-4 py-3">
									<UsersIcon className="size-4 text-muted-foreground" />
									<span className="flex-1 truncate text-sm">{team.name}</span>
									<Button
										variant="outline"
										size="sm"
										onClick={async () => {
											await authClient.organization.setActive({
												organizationId: team.id,
											});
											router.refresh();
										}}
									>
										{t("none.switch")}
									</Button>
								</li>
							))}
						</ul>
					</div>
				)}
			</Section>
			<Section title={t("create.title")} description={t("create.description")}>
				<CreateTeamForm />
			</Section>
		</>
	);
}
