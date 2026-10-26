"use client";

import { Button } from "@repo/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

/** better-auth needs a unique slug. The app never shows it. */
function slugFor(name: string): string {
	const base =
		name
			.normalize("NFKD")
			.replace(/[̀-ͯ]/g, "")
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 40) || "team";
	return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

/** Creates a team. It becomes the active team, and its settings open. */
export function CreateTeamForm({ onCreated }: { onCreated?: () => void }) {
	const t = useTranslations("Org");
	const router = useRouter();
	const [name, setName] = useState("");
	const [pending, setPending] = useState(false);

	const onSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setPending(true);
		const { data, error } = await authClient.organization.create({
			name: name.trim(),
			slug: slugFor(name),
		});
		if (data) {
			// Also refreshes the session cookie, so pages see the new team.
			await authClient.organization.setActive({ organizationId: data.id });
		}
		setPending(false);
		if (error) {
			toast.error(error.message ?? t("error"));
			return;
		}
		toast.success(t("create.created"));
		setName("");
		onCreated?.();
		router.push("/org");
		router.refresh();
	};

	return (
		<form onSubmit={onSubmit}>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="team-name">{t("create.name")}</FieldLabel>
					<Input
						id="team-name"
						required
						maxLength={80}
						placeholder={t("create.namePlaceholder")}
						value={name}
						onChange={(event) => setName(event.target.value)}
					/>
				</Field>
				<Button type="submit" disabled={pending} className="w-fit">
					{t("create.submit")}
				</Button>
			</FieldGroup>
		</form>
	);
}
