import { getAuth } from "@repo/auth";
import { Skeleton } from "@repo/ui/components/skeleton";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { NoTeam } from "@/components/org/no-team";
import { type Role, TeamSettings } from "@/components/org/team-settings";
import { requireSession } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("Org");
	return { title: t("title") };
}

export default async function OrgPage() {
	const t = await getTranslations("Org");
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
				<p className="text-muted-foreground">{t("description")}</p>
			</div>
			<Suspense fallback={<Skeleton className="h-64" />}>
				<Team />
			</Suspense>
		</div>
	);
}

/** better-auth roles are strings; the app knows these three. */
function roleOf(value: string): Role {
	return value === "owner" || value === "admin" ? value : "member";
}

async function Team() {
	const session = await requireSession();
	const requestHeaders = await headers();
	const auth = getAuth();
	const team = session.session.activeOrganizationId
		? await auth.api.getFullOrganization({ headers: requestHeaders })
		: null;

	if (!team) {
		const teams = await auth.api.listOrganizations({ headers: requestHeaders });
		return <NoTeam teams={teams.map(({ id, name }) => ({ id, name }))} />;
	}

	const role = roleOf(
		team.members.find((member) => member.userId === session.user.id)?.role ??
			"member",
	);
	return (
		<TeamSettings
			team={{ id: team.id, name: team.name }}
			userId={session.user.id}
			role={role}
			members={team.members.map((member) => ({
				id: member.id,
				userId: member.userId,
				name: member.user.name,
				email: member.user.email,
				role: roleOf(member.role),
			}))}
			invitations={team.invitations
				.filter((invitation) => invitation.status === "pending")
				.map((invitation) => ({
					id: invitation.id,
					email: invitation.email,
					role: roleOf(invitation.role),
					expiresAt: new Date(invitation.expiresAt).toISOString(),
				}))}
		/>
	);
}
