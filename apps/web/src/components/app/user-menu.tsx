"use client";

import { resetAnalytics } from "@repo/analytics/client"; // turbinekit:analytics
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@repo/ui/components/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { SidebarMenuButton } from "@repo/ui/components/sidebar";
import { LogOutIcon, SettingsIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { getPathname, useRouter } from "@/i18n/navigation";
import { signOut, useSession } from "@/lib/auth-client";

function initials(name: string | undefined): string {
	return (name ?? "?")
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("");
}

/** The signed-in user, with the way to account settings and out. */
export function UserMenu() {
	const t = useTranslations("App.userMenu");
	const locale = useLocale();
	const router = useRouter();
	const { data } = useSession();
	const user = data?.user;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={<SidebarMenuButton size="lg" aria-label={t("toggle")} />}
			>
				<Avatar className="size-8 rounded-lg">
					{user?.image && <AvatarImage src={user.image} alt="" />}
					<AvatarFallback className="rounded-lg">
						{initials(user?.name)}
					</AvatarFallback>
				</Avatar>
				<div className="grid flex-1 text-left text-sm leading-tight">
					<span className="truncate font-medium">{user?.name}</span>
					<span className="truncate text-xs text-muted-foreground">
						{user?.email}
					</span>
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent side="top" align="start" className="w-56">
				<DropdownMenuLabel className="truncate">
					{user?.email}
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => router.push("/account")}>
					<SettingsIcon />
					{t("account")}
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={async () => {
						resetAnalytics(); // turbinekit:analytics
						await signOut();
						window.location.assign(getPathname({ href: "/", locale }));
					}}
				>
					<LogOutIcon />
					{t("signOut")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
