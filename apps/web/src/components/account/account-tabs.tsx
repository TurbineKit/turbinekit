"use client";

import { cn } from "@repo/ui/lib/utils";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const TABS = [
	{ href: "/account", label: "profile" },
	{ href: "/account/security", label: "security" },
	{ href: "/account/api-keys", label: "apiKeys" },
	{ href: "/account/connected-apps", label: "connectedApps" },
	{ href: "/account/billing", label: "billing" }, // turbinekit:payments
] as const;

export function AccountTabs() {
	const t = useTranslations("Account.tabs");
	const pathname = usePathname();
	return (
		<nav className="flex gap-1 overflow-x-auto border-b">
			{TABS.map((tab) => (
				<Link
					key={tab.href}
					href={tab.href}
					className={cn(
						"-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap text-muted-foreground",
						pathname === tab.href
							? "border-foreground text-foreground"
							: "border-transparent hover:text-foreground",
					)}
				>
					{t(tab.label)}
				</Link>
			))}
		</nav>
	);
}
