"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { SidebarMenuButton } from "@repo/ui/components/sidebar";
import {
	CheckIcon,
	ChevronsUpDownIcon,
	PlusIcon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CreateTeamForm } from "@/components/org/create-team-form";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

/**
 * The space the app works in: personal, or one of the user's teams. The
 * choice is the session's active organization, so pages, server actions and
 * new API keys all follow it.
 */
export function OrgSwitcher() {
	const t = useTranslations("Org");
	const router = useRouter();
	const { data: active } = authClient.useActiveOrganization();
	const { data: teams, refetch } = authClient.useListOrganizations();
	const [creating, setCreating] = useState(false);

	const switchTo = async (organizationId: string | null) => {
		await authClient.organization.setActive({ organizationId });
		router.refresh();
	};

	return (
		<>
			<DropdownMenu onOpenChange={(open) => open && refetch()}>
				<DropdownMenuTrigger
					render={
						<SidebarMenuButton size="lg" aria-label={t("switcher.label")} />
					}
				>
					<div className="flex size-8 items-center justify-center rounded-lg border bg-background">
						{active ? (
							<UsersIcon className="size-4" />
						) : (
							<UserIcon className="size-4" />
						)}
					</div>
					<span className="flex-1 truncate text-left text-sm font-medium">
						{active?.name ?? t("personal")}
					</span>
					<ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="w-56">
					<DropdownMenuItem onClick={() => switchTo(null)}>
						<UserIcon />
						<span className="flex-1 truncate">{t("personal")}</span>
						{!active && <CheckIcon />}
					</DropdownMenuItem>
					{teams?.map((team) => (
						<DropdownMenuItem key={team.id} onClick={() => switchTo(team.id)}>
							<UsersIcon />
							<span className="flex-1 truncate">{team.name}</span>
							{team.id === active?.id && <CheckIcon />}
						</DropdownMenuItem>
					))}
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={() => setCreating(true)}>
						<PlusIcon />
						{t("switcher.create")}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<Dialog open={creating} onOpenChange={setCreating}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("create.title")}</DialogTitle>
						<DialogDescription>{t("create.description")}</DialogDescription>
					</DialogHeader>
					<CreateTeamForm onCreated={() => setCreating(false)} />
				</DialogContent>
			</Dialog>
		</>
	);
}
