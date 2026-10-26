"use client";

import { Button } from "@repo/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { authErrorMessage } from "@/components/auth/auth-error";
import { authClient } from "@/lib/auth-client";

export function ChangePassword() {
	const t = useTranslations("Account.password");
	const te = useTranslations("Auth.errors");
	const [current, setCurrent] = useState("");
	const [next, setNext] = useState("");
	const [saving, setSaving] = useState(false);

	const onSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setSaving(true);
		const { error } = await authClient.changePassword({
			currentPassword: current,
			newPassword: next,
			revokeOtherSessions: true,
		});
		setSaving(false);
		if (error) {
			toast.error(authErrorMessage(error, te));
			return;
		}
		setCurrent("");
		setNext("");
		toast.success(t("done"));
	};

	return (
		<form onSubmit={onSubmit}>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="current-password">{t("current")}</FieldLabel>
					<Input
						id="current-password"
						type="password"
						autoComplete="current-password"
						required
						value={current}
						onChange={(event) => setCurrent(event.target.value)}
					/>
				</Field>
				<Field>
					<FieldLabel htmlFor="new-password">{t("new")}</FieldLabel>
					<Input
						id="new-password"
						type="password"
						autoComplete="new-password"
						required
						minLength={8}
						value={next}
						onChange={(event) => setNext(event.target.value)}
					/>
				</Field>
				<div>
					<Button type="submit" disabled={saving}>
						{t("submit")}
					</Button>
				</div>
			</FieldGroup>
		</form>
	);
}
