"use client";

import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Field, FieldGroup, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { authErrorMessage } from "@/components/auth/auth-error";
import { followOAuthRedirect } from "@/components/auth/oauth-flow";
import { getPathname } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/oauth-query";

type Method = "app" | "email" | "backup";

/** The second step of a sign-in: an app code, an emailed code, or a backup code. */
export function TwoFactorForm() {
	const t = useTranslations("Auth");
	const te = useTranslations("Auth.errors");
	const locale = useLocale();
	const [method, setMethod] = useState<Method>("app");
	const [code, setCode] = useState("");
	const [trustDevice, setTrustDevice] = useState(true);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const destination = () =>
		safeNext(new URLSearchParams(window.location.search).get("next")) ??
		getPathname({ href: "/dashboard", locale });

	const onSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setLoading(true);
		setError(null);
		const twoFactor = authClient.twoFactor;
		const request =
			method === "app"
				? twoFactor.verifyTotp({ code, trustDevice })
				: method === "email"
					? twoFactor.verifyOtp({ code, trustDevice })
					: twoFactor.verifyBackupCode({ code, trustDevice });
		const { data, error } = await request.catch(() => ({
			data: null,
			error: {},
		}));
		if (error) {
			setError(authErrorMessage(error, te));
			setLoading(false);
			return;
		}
		if (!followOAuthRedirect(data)) {
			window.location.assign(destination());
		}
	};

	const switchTo = async (next: Method) => {
		setMethod(next);
		setCode("");
		setError(null);
		if (next === "email") {
			await authClient.twoFactor.sendOtp().catch(() => null);
		}
	};

	const description =
		method === "app"
			? t("twoFactor.description")
			: method === "email"
				? t("twoFactor.emailDescription")
				: t("twoFactor.backupDescription");

	return (
		<form onSubmit={onSubmit}>
			<FieldGroup>
				<p className="text-sm text-muted-foreground">{description}</p>
				<Field>
					<FieldLabel htmlFor="code">{t("twoFactor.code")}</FieldLabel>
					<Input
						id="code"
						inputMode={method === "backup" ? "text" : "numeric"}
						autoComplete="one-time-code"
						required
						value={code}
						onChange={(event) => setCode(event.target.value.trim())}
					/>
				</Field>
				<Field orientation="horizontal">
					<Checkbox
						id="trust"
						checked={trustDevice}
						onCheckedChange={(checked) => setTrustDevice(checked === true)}
					/>
					<FieldLabel htmlFor="trust">{t("twoFactor.trustDevice")}</FieldLabel>
				</Field>
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
				<Button type="submit" size="lg" disabled={loading}>
					{t("twoFactor.submit")}
				</Button>
				<div className="flex flex-col gap-1 text-sm">
					{method !== "app" && (
						<Button
							type="button"
							variant="link"
							onClick={() => switchTo("app")}
						>
							{t("twoFactor.useApp")}
						</Button>
					)}
					{method !== "email" && (
						<Button
							type="button"
							variant="link"
							onClick={() => switchTo("email")}
						>
							{t("twoFactor.emailCode")}
						</Button>
					)}
					{method !== "backup" && (
						<Button
							type="button"
							variant="link"
							onClick={() => switchTo("backup")}
						>
							{t("twoFactor.backupCode")}
						</Button>
					)}
				</div>
			</FieldGroup>
		</form>
	);
}
