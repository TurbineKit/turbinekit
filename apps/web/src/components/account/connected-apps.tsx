"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { BotIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { revokeApp } from "@/app/[locale]/(app)/account/actions";
import { useRouter } from "@/i18n/navigation";

export type ConnectedAppRow = {
	clientId: string;
	name: string;
	host: string | null;
	scopes: string[];
	connectedAt: Date;
	lastUsedAt: Date | null;
};

export function ConnectedApps({
	apps,
	mcpUrl,
}: {
	apps: ConnectedAppRow[];
	mcpUrl: string;
}) {
	const t = useTranslations("Account");
	const format = useFormatter();
	const router = useRouter();
	const date = (value: Date) =>
		format.dateTime(new Date(value), { dateStyle: "medium" });

	if (apps.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				{t("connectedApps.empty", { url: mcpUrl })}
			</p>
		);
	}

	return (
		<ul className="divide-y rounded-lg border">
			{apps.map((app) => (
				<li key={app.clientId} className="flex items-center gap-3 px-4 py-3">
					<BotIcon className="size-4 text-muted-foreground" />
					<div className="flex-1">
						<p className="text-sm">
							{app.name}
							{app.host && app.host !== app.name && (
								<span className="ml-2 text-xs text-muted-foreground">
									{app.host}
								</span>
							)}
						</p>
						<p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
							{app.scopes.map((scope) => (
								<Badge key={scope} variant="secondary">
									{scope}
								</Badge>
							))}
							<span className="ml-1">
								{t("connectedApps.connected", { date: date(app.connectedAt) })}
								{app.lastUsedAt &&
									` · ${t("connectedApps.lastUsed", { date: date(app.lastUsedAt) })}`}
							</span>
						</p>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={async () => {
							if (
								window.confirm(
									t("connectedApps.removeConfirm", { name: app.name }),
								)
							) {
								await revokeApp(app.clientId);
								router.refresh();
							}
						}}
					>
						{t("connectedApps.remove")}
					</Button>
				</li>
			))}
		</ul>
	);
}
