"use client";

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
import { Field, FieldGroup, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { MailIcon, UserIcon, XIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { type FormEvent, type ReactNode, useState } from "react";
import { toast } from "sonner";
import { Section } from "@/components/account/section";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

export type Role = "owner" | "admin" | "member";

export type TeamMember = {
	id: string;
	userId: string;
	name: string;
	email: string;
	role: Role;
};

export type TeamInvitation = {
	id: string;
	email: string;
	role: Role;
	expiresAt: string;
};

type Props = {
	team: { id: string; name: string };
	members: TeamMember[];
	invitations: TeamInvitation[];
	userId: string;
	role: Role;
};

/** Runs a better-auth call, shows its error, and refreshes the page's data. */
function useAction() {
	const t = useTranslations("Org");
	const router = useRouter();
	return async (
		call: () => Promise<{ error: { message?: string } | null }>,
		success?: string,
	) => {
		const { error } = await call();
		if (error) {
			toast.error(error.message ?? t("error"));
			return false;
		}
		if (success) {
			toast.success(success);
		}
		router.refresh();
		return true;
	};
}

/** The active team's settings. Owners and admins manage it. */
export function TeamSettings({
	team,
	members,
	invitations,
	userId,
	role,
}: Props) {
	const t = useTranslations("Org");
	const canManage = role === "owner" || role === "admin";

	return (
		<>
			<Section
				title={t("general.title")}
				description={t("general.description")}
			>
				<General team={team} canManage={canManage} />
			</Section>
			<Section
				title={t("members.title")}
				description={t("members.description")}
			>
				<Members
					team={team}
					members={members}
					userId={userId}
					canManage={canManage}
				/>
			</Section>
			{canManage && (
				<Section
					title={t("invitations.title")}
					description={t("invitations.description")}
				>
					<Invitations team={team} invitations={invitations} />
				</Section>
			)}
			{role === "owner" && (
				<Section
					title={t("danger.title")}
					description={t("danger.description")}
				>
					<DeleteTeam team={team} />
				</Section>
			)}
		</>
	);
}

function General({
	team,
	canManage,
}: {
	team: Props["team"];
	canManage: boolean;
}) {
	const t = useTranslations("Org");
	const run = useAction();
	const [name, setName] = useState(team.name);

	const onSubmit = async (event: FormEvent) => {
		event.preventDefault();
		await run(
			() =>
				authClient.organization.update({
					organizationId: team.id,
					data: { name: name.trim() },
				}),
			t("general.saved"),
		);
	};

	return (
		<form onSubmit={onSubmit}>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="team-settings-name">
						{t("general.name")}
					</FieldLabel>
					<Input
						id="team-settings-name"
						required
						maxLength={80}
						disabled={!canManage}
						value={name}
						onChange={(event) => setName(event.target.value)}
					/>
				</Field>
				{canManage && (
					<Button type="submit" className="w-fit">
						{t("general.save")}
					</Button>
				)}
			</FieldGroup>
		</form>
	);
}

function RoleSelect({
	id,
	value,
	onChange,
	label,
}: {
	id?: string;
	value: Role;
	onChange: (role: Role) => void;
	label?: string;
}) {
	const t = useTranslations("Org.members.roles");
	return (
		<Select
			value={value}
			onValueChange={(next) => onChange(next as Role)}
			items={[
				{ value: "member", label: t("member") },
				{ value: "admin", label: t("admin") },
			]}
		>
			<SelectTrigger id={id} aria-label={label} className="w-40">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="member">{t("member")}</SelectItem>
				<SelectItem value="admin">{t("admin")}</SelectItem>
			</SelectContent>
		</Select>
	);
}

/** A confirmation dialog around a destructive action. */
function Confirm({
	trigger,
	title,
	description,
	confirm,
	onConfirm,
}: {
	trigger: ReactNode;
	title: string;
	description: string;
	confirm: string;
	onConfirm: () => Promise<unknown>;
}) {
	const t = useTranslations("Account");
	return (
		<AlertDialog>
			<AlertDialogTrigger render={<Button variant="ghost" size="sm" />}>
				{trigger}
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
					<Button variant="destructive" onClick={onConfirm}>
						{confirm}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function Members({
	team,
	members,
	userId,
	canManage,
}: {
	team: Props["team"];
	members: TeamMember[];
	userId: string;
	canManage: boolean;
}) {
	const t = useTranslations("Org");
	const router = useRouter();
	const run = useAction();
	const self = members.find((member) => member.userId === userId);

	return (
		<div className="flex flex-col gap-4">
			<ul className="divide-y rounded-lg border">
				{members.map((member) => {
					const isSelf = member.userId === userId;
					const editable = canManage && !isSelf && member.role !== "owner";
					return (
						<li key={member.id} className="flex items-center gap-3 px-4 py-3">
							<UserIcon className="size-4 text-muted-foreground" />
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm">
									{member.name || member.email}
									{isSelf && (
										<span className="text-muted-foreground">
											{" "}
											({t("members.you")})
										</span>
									)}
								</p>
								<p className="truncate text-xs text-muted-foreground">
									{member.email}
								</p>
							</div>
							{editable ? (
								<RoleSelect
									value={member.role}
									label={t("members.role", {
										name: member.name || member.email,
									})}
									onChange={(role) =>
										run(() =>
											authClient.organization.updateMemberRole({
												organizationId: team.id,
												memberId: member.id,
												role,
											}),
										)
									}
								/>
							) : (
								<Badge variant="secondary">
									{t(`members.roles.${member.role}`)}
								</Badge>
							)}
							{editable && (
								<Confirm
									trigger={t("members.remove")}
									title={t("members.remove")}
									description={t("members.removeConfirm", {
										name: member.name || member.email,
									})}
									confirm={t("members.remove")}
									onConfirm={() =>
										run(() =>
											authClient.organization.removeMember({
												organizationId: team.id,
												memberIdOrEmail: member.id,
											}),
										)
									}
								/>
							)}
						</li>
					);
				})}
			</ul>
			{self && self.role !== "owner" && (
				<div>
					<Confirm
						trigger={t("members.leave")}
						title={t("members.leave")}
						description={t("members.leaveConfirm", { team: team.name })}
						confirm={t("members.leave")}
						onConfirm={async () => {
							const left = await run(() =>
								authClient.organization.leave({ organizationId: team.id }),
							);
							if (left) {
								router.push("/org");
							}
						}}
					/>
				</div>
			)}
		</div>
	);
}

function Invitations({
	team,
	invitations,
}: {
	team: Props["team"];
	invitations: TeamInvitation[];
}) {
	const t = useTranslations("Org");
	const format = useFormatter();
	const run = useAction();
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<Role>("member");
	const [pending, setPending] = useState(false);

	const onInvite = async (event: FormEvent) => {
		event.preventDefault();
		setPending(true);
		const sent = await run(
			() =>
				authClient.organization.inviteMember({
					organizationId: team.id,
					email: email.trim(),
					role,
				}),
			t("invitations.sent", { email: email.trim() }),
		);
		setPending(false);
		if (sent) {
			setEmail("");
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<form onSubmit={onInvite} className="flex flex-wrap items-end gap-3">
				<Field className="min-w-56 flex-1">
					<FieldLabel htmlFor="invite-email">
						{t("invitations.email")}
					</FieldLabel>
					<Input
						id="invite-email"
						type="email"
						required
						autoComplete="off"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
					/>
				</Field>
				<Field className="w-fit">
					<FieldLabel htmlFor="invite-role">{t("invitations.role")}</FieldLabel>
					<RoleSelect id="invite-role" value={role} onChange={setRole} />
				</Field>
				<Button type="submit" disabled={pending}>
					{t("invitations.send")}
				</Button>
			</form>
			{invitations.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					{t("invitations.empty")}
				</p>
			) : (
				<ul className="divide-y rounded-lg border">
					{invitations.map((invitation) => (
						<li
							key={invitation.id}
							className="flex items-center gap-3 px-4 py-3"
						>
							<MailIcon className="size-4 text-muted-foreground" />
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm">{invitation.email}</p>
								<p className="text-xs text-muted-foreground">
									{t(`members.roles.${invitation.role}`)} ·{" "}
									{t("invitations.expires", {
										date: format.dateTime(new Date(invitation.expiresAt), {
											dateStyle: "medium",
											timeStyle: "short",
										}),
									})}
								</p>
							</div>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={t("invitations.cancel")}
								onClick={() =>
									run(() =>
										authClient.organization.cancelInvitation({
											invitationId: invitation.id,
										}),
									)
								}
							>
								<XIcon />
							</Button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function DeleteTeam({ team }: { team: Props["team"] }) {
	const t = useTranslations("Org");
	const ta = useTranslations("Account");
	const router = useRouter();
	const run = useAction();
	return (
		<AlertDialog>
			<AlertDialogTrigger render={<Button variant="destructive" />}>
				{t("danger.delete")}
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("danger.delete")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t("danger.confirm", { team: team.name })}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{ta("cancel")}</AlertDialogCancel>
					<Button
						variant="destructive"
						onClick={async () => {
							const deleted = await run(() =>
								authClient.organization.delete({ organizationId: team.id }),
							);
							if (deleted) {
								router.push("/org");
							}
						}}
					>
						{t("danger.delete")}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
