"use client";

import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Field, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { EllipsisIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import {
	banUserAction,
	impersonateAction,
	setRoleAction,
	unbanUserAction,
} from "@/app/[locale]/(app)/admin/actions";
import { getPathname, useRouter } from "@/i18n/navigation";

type Props = {
	user: { id: string; name: string; admin: boolean; banned: boolean };
};

/** What an admin can do to another user. Each action is audited. */
export function UserActions({ user }: Props) {
	const t = useTranslations("Admin");
	const locale = useLocale();
	const router = useRouter();
	const [banning, setBanning] = useState(false);
	const [reason, setReason] = useState("");

	const run = async (action: () => Promise<unknown>) => {
		try {
			await action();
			router.refresh();
			return true;
		} catch (error) {
			toast.error(t("error", { message: (error as Error).message }));
			return false;
		}
	};

	const onBan = async (event: FormEvent) => {
		event.preventDefault();
		if (await run(() => banUserAction({ userId: user.id, reason }))) {
			setBanning(false);
			setReason("");
		}
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label={t("users.menu", { name: user.name })}
						/>
					}
				>
					<EllipsisIcon />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-56">
					{!user.banned && (
						<DropdownMenuItem
							onClick={async () => {
								if (await run(() => impersonateAction(user.id))) {
									window.location.assign(
										getPathname({ href: "/dashboard", locale }),
									);
								}
							}}
						>
							{t("users.viewAs")}
						</DropdownMenuItem>
					)}
					<DropdownMenuItem
						onClick={() =>
							run(() =>
								setRoleAction({
									userId: user.id,
									role: user.admin ? "user" : "admin",
								}),
							)
						}
					>
						{user.admin ? t("users.removeAdmin") : t("users.makeAdmin")}
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					{user.banned ? (
						<DropdownMenuItem
							onClick={() => run(() => unbanUserAction(user.id))}
						>
							{t("users.unban")}
						</DropdownMenuItem>
					) : (
						<DropdownMenuItem
							variant="destructive"
							onClick={() => setBanning(true)}
						>
							{t("users.ban")}
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
			<Dialog open={banning} onOpenChange={setBanning}>
				<DialogContent>
					<form onSubmit={onBan}>
						<DialogHeader>
							<DialogTitle>
								{t("users.banTitle", { name: user.name })}
							</DialogTitle>
							<DialogDescription>{t("users.banDescription")}</DialogDescription>
						</DialogHeader>
						<Field className="my-6">
							<FieldLabel htmlFor={`ban-reason-${user.id}`}>
								{t("users.banReason")}
							</FieldLabel>
							<Input
								id={`ban-reason-${user.id}`}
								maxLength={500}
								value={reason}
								onChange={(event) => setReason(event.target.value)}
							/>
						</Field>
						<DialogFooter>
							<Button type="submit" variant="destructive">
								{t("users.ban")}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
