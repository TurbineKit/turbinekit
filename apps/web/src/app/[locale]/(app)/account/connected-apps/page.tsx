import { listConnectedApps } from "@repo/auth";
import { getDb } from "@repo/db";
import { siteUrl } from "@repo/site";
import { Skeleton } from "@repo/ui/components/skeleton";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ConnectedApps } from "@/components/account/connected-apps";
import { Section } from "@/components/account/section";
import { requireSession } from "@/lib/session";

export default async function ConnectedAppsPage() {
	const t = await getTranslations("Account.connectedApps");
	return (
		<Section title={t("title")} description={t("description")}>
			<Suspense fallback={<Skeleton className="h-24" />}>
				<AppList />
			</Suspense>
		</Section>
	);
}

async function AppList() {
	const { user } = await requireSession();
	const apps = await listConnectedApps(getDb(), user.id);
	return <ConnectedApps apps={apps} mcpUrl={`${siteUrl()}/mcp`} />;
}
