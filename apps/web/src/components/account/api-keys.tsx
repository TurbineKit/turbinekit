"use client";

import { track } from "@repo/analytics/client"; // turbinekit:analytics
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
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@repo/ui/components/dialog";
import { Field, FieldGroup, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { KeyRoundIcon, Trash2Icon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import {
	createApiKey,
	deleteApiKey,
} from "@/app/[locale]/(app)/account/actions";
import { useRouter } from "@/i18n/navigation";

export type ApiKeyRow = {
	id: string;
	name: string | null;
	start: string | null;
	scopes: string[];
	createdAt: Date;
	lastUsedAt: Date | null;
	team?: string; // turbinekit:orgs
};

type Access = "read" | "readWrite";

type Props = {
	keys: ApiKeyRow[];
	/** The active team: new keys act for it. */
	activeTeam?: string; // turbinekit:orgs
};

export function ApiKeys(props: Props) {
	const { keys } = props;
	const t = useTranslations("Account");
	const format = useFormatter();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [access, setAccess] = useState<Access>("read");
	const [created, setCreated] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	const onCreate = async (event: FormEvent) => {
		event.preventDefault();
		setPending(true);
		try {
			const { key } = await createApiKey({ name, access });
			track("api_key_created", { access }); // turbinekit:analytics
			setCreated(key);
			setName("");
			router.refresh();
		} catch {
			toast.error(t("apiKeys.title"));
		} finally {
			setPending(false);
		}
	};

	const close = () => {
		setOpen(false);
		setCreated(null);
	};

	const date = (value: Date) =>
		format.dateTime(new Date(value), { dateStyle: "medium" });

	return (
		<div className="flex flex-col gap-4">
			{keys.length === 0 ? (
				<p className="text-sm text-muted-foreground">{t("apiKeys.empty")}</p>
			) : (
				<ul className="divide-y rounded-lg border">
					{keys.map((key) => (
						<li key={key.id} className="flex items-center gap-3 px-4 py-3">
							<KeyRoundIcon className="size-4 text-muted-foreground" />
							<div className="flex-1">
								<p className="text-sm">
									{key.name}{" "}
									<span className="font-mono text-xs text-muted-foreground">
										{key.start}…
									</span>
								</p>
								<p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
									{key.scopes.map((scope) => (
										<Badge key={scope} variant="secondary">
											{scope}
										</Badge>
									))}
									{/* #region turbinekit:orgs */}
									{key.team && (
										<Badge variant="outline">
											{t("apiKeys.team", { team: key.team })}
										</Badge>
									)}
									{/* #endregion turbinekit:orgs */}
									<span className="ml-1">
										{key.lastUsedAt
											? t("apiKeys.lastUsed", { date: date(key.lastUsedAt) })
											: t("apiKeys.neverUsed")}
									</span>
								</p>
							</div>
							<AlertDialog>
								<AlertDialogTrigger
									render={
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label={t("delete")}
										/>
									}
								>
									<Trash2Icon />
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>{t("delete")}</AlertDialogTitle>
										<AlertDialogDescription>
											{t("apiKeys.deleteConfirm", { name: key.name ?? "" })}
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
										<Button
											variant="destructive"
											onClick={async () => {
												await deleteApiKey(key.id);
												router.refresh();
											}}
										>
											{t("delete")}
										</Button>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</li>
					))}
				</ul>
			)}

			<Dialog
				open={open}
				onOpenChange={(next) => (next ? setOpen(true) : close())}
			>
				<DialogTrigger render={<Button variant="outline" className="w-fit" />}>
					{t("apiKeys.create")}
				</DialogTrigger>
				<DialogContent>
					{created ? (
						<>
							<DialogHeader>
								<DialogTitle>{t("apiKeys.createdTitle")}</DialogTitle>
								<DialogDescription>
									{t("apiKeys.createdDescription")}
								</DialogDescription>
							</DialogHeader>
							<code className="rounded-lg border bg-muted p-3 font-mono text-sm break-all">
								{created}
							</code>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={async () => {
										await navigator.clipboard.writeText(created);
										toast.success(t("copied"));
									}}
								>
									{t("copy")}
								</Button>
								<Button onClick={close}>{t("close")}</Button>
							</DialogFooter>
						</>
					) : (
						<form onSubmit={onCreate}>
							<DialogHeader>
								<DialogTitle>{t("apiKeys.create")}</DialogTitle>
								<DialogDescription>
									{t("apiKeys.description")}
								</DialogDescription>
								{/* #region turbinekit:orgs */}
								{props.activeTeam && (
									<p className="text-sm">
										{t("apiKeys.forTeam", { team: props.activeTeam })}
									</p>
								)}
								{/* #endregion turbinekit:orgs */}
							</DialogHeader>
							<FieldGroup className="my-6">
								<Field>
									<FieldLabel htmlFor="key-name">
										{t("apiKeys.name")}
									</FieldLabel>
									<Input
										id="key-name"
										required
										maxLength={64}
										placeholder={t("apiKeys.namePlaceholder")}
										value={name}
										onChange={(event) => setName(event.target.value)}
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="key-access">
										{t("apiKeys.access")}
									</FieldLabel>
									<Select
										value={access}
										onValueChange={(value) => setAccess(value as Access)}
										items={[
											{ value: "read", label: t("apiKeys.read") },
											{ value: "readWrite", label: t("apiKeys.readWrite") },
										]}
									>
										<SelectTrigger id="key-access" className="w-56">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="read">{t("apiKeys.read")}</SelectItem>
											<SelectItem value="readWrite">
												{t("apiKeys.readWrite")}
											</SelectItem>
										</SelectContent>
									</Select>
								</Field>
							</FieldGroup>
							<DialogFooter>
								<Button type="submit" disabled={pending}>
									{t("apiKeys.create")}
								</Button>
							</DialogFooter>
						</form>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
