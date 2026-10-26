"use client";

import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getPathname } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

/**
 * After sign-up: "check your inbox", with a button to send the link again.
 * A failed verification link lands here too, with `?error=`.
 */
export function VerifyEmailNotice() {
	const t = useTranslations("Auth.verify");
	const locale = useLocale();
	const [email, setEmail] = useState<string | null>(null);
	const [failed, setFailed] = useState(false);
	const [sent, setSent] = useState(false);
	const [sending, setSending] = useState(false);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		setEmail(params.get("email"));
		setFailed(params.has("error"));
	}, []);

	if (failed) {
		return (
			<Alert variant="destructive">
				<AlertDescription>{t("invalid")}</AlertDescription>
			</Alert>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<p className="text-muted-foreground">
				{email ? t("description", { email }) : t("descriptionNoEmail")}
			</p>
			{email && (
				<Button
					variant="outline"
					disabled={sending || sent}
					onClick={async () => {
						setSending(true);
						await authClient
							.sendVerificationEmail({
								email,
								callbackURL: getPathname({ href: "/dashboard", locale }),
							})
							.catch(() => null);
						setSending(false);
						setSent(true);
					}}
				>
					{sent ? t("sent") : t("resend")}
				</Button>
			)}
		</div>
	);
}
