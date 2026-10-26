"use client";

import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { useTranslations } from "next-intl";
import { type FormEvent, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

/** The page the reset link lands on, with `?token=` (or `?error=`). */
export function ResetPasswordForm() {
	const t = useTranslations("Auth");
	const [token, setToken] = useState<string | null>(null);
	const [invalid, setInvalid] = useState(false);
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [done, setDone] = useState(false);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		setToken(params.get("token"));
		setInvalid(params.has("error") || !params.has("token"));
	}, []);

	const onSubmit = async (event: FormEvent) => {
		event.preventDefault();
		if (!token) {
			return;
		}
		setLoading(true);
		const { error } = await authClient
			.resetPassword({ newPassword: password, token })
			.catch(() => ({ error: {} }));
		setLoading(false);
		if (error) {
			setInvalid(true);
			return;
		}
		setDone(true);
	};

	if (done || invalid) {
		return (
			<div className="flex flex-col gap-4">
				<Alert variant={done ? "default" : "destructive"}>
					<AlertDescription>
						{done ? t("reset.done") : t("reset.invalid")}
					</AlertDescription>
				</Alert>
				<Link
					href={done ? "/sign-in" : "/forgot-password"}
					className="text-center text-sm underline underline-offset-4"
				>
					{done ? t("signIn.submit") : t("forgot.submit")}
				</Link>
			</div>
		);
	}

	return (
		<form onSubmit={onSubmit}>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="password">{t("newPassword")}</FieldLabel>
					<Input
						id="password"
						type="password"
						autoComplete="new-password"
						required
						minLength={8}
						value={password}
						onChange={(event) => setPassword(event.target.value)}
					/>
				</Field>
				<Button type="submit" size="lg" disabled={loading || !token}>
					{t("reset.submit")}
				</Button>
			</FieldGroup>
		</form>
	);
}
