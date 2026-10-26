"use client";

import { resetAnalytics } from "@repo/analytics/client"; // turbinekit:analytics
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { getPathname } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

export function DeleteAccount() {
	const t = useTranslations("Account");
	const locale = useLocale();
	const [password, setPassword] = useState("");
	const [pending, setPending] = useState(false);

	const onDelete = async () => {
		setPending(true);
		const { error } = await authClient.deleteUser({ password });
		setPending(false);
		if (error) {
			toast.error(error.message);
			return;
		}
		resetAnalytics(); // turbinekit:analytics
		window.location.assign(getPathname({ href: "/", locale }));
	};

	return (
		<AlertDialog>
			<AlertDialogTrigger render={<Button variant="destructive" />}>
				{t("danger.button")}
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("danger.title")}</AlertDialogTitle>
					<AlertDialogDescription>{t("danger.confirm")}</AlertDialogDescription>
				</AlertDialogHeader>
				<Input
					type="password"
					autoComplete="current-password"
					aria-label={t("password.current")}
					value={password}
					onChange={(event) => setPassword(event.target.value)}
				/>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
					<Button
						variant="destructive"
						disabled={pending || password.length === 0}
						onClick={onDelete}
					>
						{t("danger.button")}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
