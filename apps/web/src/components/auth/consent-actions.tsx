"use client";

import { Button } from "@repo/ui/components/button";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * Allow or Deny. The client plugin (oauthProviderClient) sends the page's
 * signed query along; the answer is the URL that returns to the MCP client,
 * with a code or an access_denied error.
 */
export function ConsentActions() {
	const t = useTranslations("Auth.consent");
	const [busy, setBusy] = useState(false);
	const [failed, setFailed] = useState(false);

	const choose = async (accept: boolean) => {
		setBusy(true);
		setFailed(false);
		const { data, error } = await authClient.oauth2
			.consent({ accept })
			.catch(() => ({ data: null, error: {} }));
		const url = (data as { url?: unknown } | null)?.url;
		if (error || typeof url !== "string") {
			setFailed(true);
			setBusy(false);
			return;
		}
		window.location.assign(url);
	};

	return (
		<div className="flex flex-col gap-3">
			{failed && (
				<p role="alert" className="text-sm text-destructive">
					{t("error")}
				</p>
			)}
			<div className="grid gap-3 sm:grid-cols-2">
				<Button variant="outline" disabled={busy} onClick={() => choose(false)}>
					{t("deny")}
				</Button>
				<Button disabled={busy} onClick={() => choose(true)}>
					{t("allow")}
				</Button>
			</div>
		</div>
	);
}
