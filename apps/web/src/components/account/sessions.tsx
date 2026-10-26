"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { MonitorIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";

type SessionRow = {
	id: string;
	token: string;
	userAgent?: string | null;
	ipAddress?: string | null;
	createdAt: Date;
};

/** A short name for a browser from its user agent: "Firefox on macOS". */
function deviceName(userAgent: string | null | undefined): string | null {
	if (!userAgent) {
		return null;
	}
	const browser = /Edg\//.test(userAgent)
		? "Edge"
		: /Firefox\//.test(userAgent)
			? "Firefox"
			: /Chrome\//.test(userAgent)
				? "Chrome"
				: /Safari\//.test(userAgent)
					? "Safari"
					: null;
	const os = /Mac OS X/.test(userAgent)
		? "macOS"
		: /Windows/.test(userAgent)
			? "Windows"
			: /Android/.test(userAgent)
				? "Android"
				: /iPhone|iPad/.test(userAgent)
					? "iOS"
					: /Linux/.test(userAgent)
						? "Linux"
						: null;
	return [browser, os].filter(Boolean).join(" · ") || null;
}

export function Sessions() {
	const t = useTranslations("Account");
	const format = useFormatter();
	const { data: current } = useSession();
	const [sessions, setSessions] = useState<SessionRow[]>([]);

	const load = useCallback(async () => {
		const { data } = await authClient.listSessions();
		setSessions((data ?? []) as SessionRow[]);
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const currentToken = current?.session.token;

	return (
		<div className="flex flex-col gap-4">
			<ul className="divide-y rounded-lg border">
				{sessions.map((session) => (
					<li key={session.id} className="flex items-center gap-3 px-4 py-3">
						<MonitorIcon className="size-4 text-muted-foreground" />
						<div className="flex-1">
							<p className="text-sm">
								{deviceName(session.userAgent) ?? t("sessions.unknown")}
								{session.token === currentToken && (
									<Badge variant="secondary" className="ml-2">
										{t("sessions.current")}
									</Badge>
								)}
							</p>
							<p className="text-xs text-muted-foreground">
								{t("sessions.lastActive", {
									date: format.dateTime(new Date(session.createdAt), {
										dateStyle: "medium",
										timeStyle: "short",
									}),
								})}
								{session.ipAddress ? ` · ${session.ipAddress}` : ""}
							</p>
						</div>
						{session.token !== currentToken && (
							<Button
								variant="ghost"
								size="sm"
								onClick={async () => {
									await authClient.revokeSession({ token: session.token });
									load();
								}}
							>
								{t("sessions.revoke")}
							</Button>
						)}
					</li>
				))}
			</ul>
			{sessions.length > 1 && (
				<div>
					<Button
						variant="outline"
						onClick={async () => {
							await authClient.revokeOtherSessions();
							load();
						}}
					>
						{t("sessions.revokeOthers")}
					</Button>
				</div>
			)}
		</div>
	);
}
