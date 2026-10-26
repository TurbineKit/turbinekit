import {
	getAuth,
	scopesFromPermissions,
	teamOfKey, // turbinekit:orgs
} from "@repo/auth";
import { Skeleton } from "@repo/ui/components/skeleton";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ApiKeys } from "@/components/account/api-keys";
import { Section } from "@/components/account/section";
import { requireSession } from "@/lib/session";

export default async function ApiKeysPage() {
	const t = await getTranslations("Account.apiKeys");
	return (
		<Section title={t("title")} description={t("description")}>
			<Suspense fallback={<Skeleton className="h-24" />}>
				<ApiKeyList />
			</Suspense>
		</Section>
	);
}

async function ApiKeyList() {
	await requireSession();
	const requestHeaders = await headers();
	const auth = getAuth();
	const result = await auth.api.listApiKeys({ headers: requestHeaders });
	const keys = Array.isArray(result) ? result : result.apiKeys;
	// #region turbinekit:orgs
	const { session } = await requireSession();
	const teams = new Map(
		(await auth.api.listOrganizations({ headers: requestHeaders })).map(
			(team) => [team.id, team.name],
		),
	);
	const activeTeam = teams.get(session.activeOrganizationId ?? "");
	// #endregion turbinekit:orgs
	return (
		<ApiKeys
			activeTeam={activeTeam} // turbinekit:orgs
			keys={keys.map((key) => ({
				id: key.id,
				name: key.name,
				start: key.start,
				scopes: scopesFromPermissions(key.permissions),
				createdAt: key.createdAt,
				lastUsedAt: key.lastRequest,
				team: teams.get(teamOfKey(key.metadata) ?? ""), // turbinekit:orgs
			}))}
		/>
	);
}
