"use client";

import { Button } from "@repo/ui/components/button";
import { FingerprintIcon, Trash2Icon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export function Passkeys() {
	const t = useTranslations("Account");
	const format = useFormatter();
	const { data: passkeys, refetch } = authClient.useListPasskeys();

	const add = async () => {
		const result = await authClient.passkey.addPasskey();
		if (result?.error) {
			toast.error(result.error.message);
			return;
		}
		toast.success(t("passkeys.added"));
		refetch();
	};

	const remove = async (id: string) => {
		await authClient.passkey.deletePasskey({ id });
		refetch();
	};

	return (
		<div className="flex flex-col gap-4">
			{passkeys && passkeys.length > 0 ? (
				<ul className="divide-y rounded-lg border">
					{passkeys.map((passkey) => (
						<li key={passkey.id} className="flex items-center gap-3 px-4 py-3">
							<FingerprintIcon className="size-4 text-muted-foreground" />
							<div className="flex-1">
								<p className="text-sm">
									{passkey.name || t("passkeys.unnamed")}
								</p>
								<p className="text-xs text-muted-foreground">
									{t("passkeys.createdAt", {
										date: format.dateTime(new Date(passkey.createdAt), {
											dateStyle: "medium",
										}),
									})}
								</p>
							</div>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={t("remove")}
								onClick={() => remove(passkey.id)}
							>
								<Trash2Icon />
							</Button>
						</li>
					))}
				</ul>
			) : (
				<p className="text-sm text-muted-foreground">{t("passkeys.empty")}</p>
			)}
			<div>
				<Button variant="outline" onClick={add}>
					{t("passkeys.add")}
				</Button>
			</div>
		</div>
	);
}
