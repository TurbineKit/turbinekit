"use client";

import { type Locale, localeNames, locales } from "@repo/i18n";
import { Button } from "@repo/ui/components/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export function ProfileForm({
	user,
}: {
	user: { name: string; email: string; locale: Locale };
}) {
	const t = useTranslations("Account");
	const [name, setName] = useState(user.name);
	const [locale, setLocale] = useState<Locale>(user.locale);
	const [saving, setSaving] = useState(false);

	const onSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setSaving(true);
		const { error } = await authClient.updateUser({ name, locale });
		setSaving(false);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success(t("saved"));
	};

	return (
		<form onSubmit={onSubmit}>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="name">{t("profile.name")}</FieldLabel>
					<Input
						id="name"
						required
						maxLength={100}
						value={name}
						onChange={(event) => setName(event.target.value)}
					/>
				</Field>
				<Field>
					<FieldLabel htmlFor="email">{t("profile.email")}</FieldLabel>
					<Input id="email" value={user.email} disabled />
					<FieldDescription>{t("profile.emailHelp")}</FieldDescription>
				</Field>
				<Field>
					<FieldLabel htmlFor="locale">{t("profile.language")}</FieldLabel>
					<Select
						value={locale}
						onValueChange={(value) => setLocale(value as Locale)}
						items={locales.map((code) => ({
							value: code,
							label: localeNames[code],
						}))}
					>
						<SelectTrigger id="locale" className="w-56">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{locales.map((code) => (
								<SelectItem key={code} value={code}>
									{localeNames[code]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
				<div>
					<Button type="submit" disabled={saving}>
						{t("save")}
					</Button>
				</div>
			</FieldGroup>
		</form>
	);
}
