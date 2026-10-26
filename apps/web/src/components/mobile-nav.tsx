"use client";

import { buttonVariants } from "@repo/ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@repo/ui/components/sheet";
import { MenuIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { NavItem } from "@/components/site-header";
import { Link } from "@/i18n/navigation";

export function MobileNav({ items }: { items: NavItem[] }) {
	const t = useTranslations("Nav");
	const [open, setOpen] = useState(false);

	if (items.length === 0) {
		return null;
	}

	const linkClass = buttonVariants({
		variant: "ghost",
		className: "w-full justify-start",
	});

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger
				className={buttonVariants({
					variant: "ghost",
					size: "icon",
					className: "md:hidden",
				})}
				aria-label={t("openMenu")}
			>
				<MenuIcon />
			</SheetTrigger>
			<SheetContent side="right" className="w-72">
				<SheetHeader>
					<SheetTitle>{t("main")}</SheetTitle>
				</SheetHeader>
				<nav className="flex flex-col gap-1 px-4">
					{items.map((item) =>
						item.external ? (
							<a key={item.href} href={item.href} className={linkClass}>
								{item.label}
							</a>
						) : (
							<Link
								key={item.href}
								href={item.href}
								className={linkClass}
								onClick={() => setOpen(false)}
							>
								{item.label}
							</Link>
						),
					)}
				</nav>
			</SheetContent>
		</Sheet>
	);
}
