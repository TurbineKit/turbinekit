"use client";

import { site } from "@repo/site";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@repo/ui/components/sidebar";
import {
	BookOpenIcon, // turbinekit:docs
	FolderIcon,
	LayoutDashboardIcon,
	type LucideIcon,
	SettingsIcon,
	ShieldIcon, // turbinekit:admin
	UsersIcon, // turbinekit:orgs
} from "lucide-react";
import { type Messages, useTranslations } from "next-intl";
import { OrgSwitcher } from "@/components/app/org-switcher"; // turbinekit:orgs
import { UserMenu } from "@/components/app/user-menu";
import { Link, usePathname } from "@/i18n/navigation";
import { useSession } from "@/lib/auth-client";

type Item = {
	href: string;
	label: keyof Messages["App"]["nav"];
	icon: LucideIcon;
	/** Served by another deployment: a plain link. */
	external?: boolean;
	adminOnly?: boolean;
};

const ITEMS: Item[] = [
	{ href: "/dashboard", label: "dashboard", icon: LayoutDashboardIcon },
	{ href: "/projects", label: "projects", icon: FolderIcon },
	{ href: "/org", label: "organization", icon: UsersIcon }, // turbinekit:orgs
	{ href: "/account", label: "account", icon: SettingsIcon },
	{ href: "/admin", label: "admin", icon: ShieldIcon, adminOnly: true }, // turbinekit:admin
	{ href: "/docs", label: "docs", icon: BookOpenIcon, external: true }, // turbinekit:docs
];

export function AppSidebar() {
	const t = useTranslations("App.nav");
	const pathname = usePathname();
	const { data } = useSession();
	const isAdmin =
		(data?.user as { role?: string | null } | undefined)?.role === "admin";

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							render={<Link href="/" />}
							className="font-semibold"
						>
							{site.name}
						</SidebarMenuButton>
					</SidebarMenuItem>
					{/* #region turbinekit:orgs */}
					<SidebarMenuItem>
						<OrgSwitcher />
					</SidebarMenuItem>
					{/* #endregion turbinekit:orgs */}
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{ITEMS.filter((item) => !item.adminOnly || isAdmin).map(
								(item) => {
									const active =
										pathname === item.href ||
										pathname.startsWith(`${item.href}/`);
									return (
										<SidebarMenuItem key={item.href}>
											<SidebarMenuButton
												isActive={active}
												tooltip={t(item.label)}
												render={
													item.external ? (
														// biome-ignore lint/a11y/useAnchorContent: the button renders its children inside.
														<a href={item.href} />
													) : (
														<Link href={item.href} />
													)
												}
											>
												<item.icon />
												<span>{t(item.label)}</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
									);
								},
							)}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<UserMenu />
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
