import { site } from "@repo/site";
import { buttonVariants } from "@repo/ui/components/button";
import { getTranslations } from "next-intl/server";
import { HeaderAccount } from "@/components/header-account";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "@/i18n/navigation";

export type NavItem = {
	href: string;
	label: string;
	/** Served by another deployment (the docs): a plain link, no locale prefix. */
	external?: boolean;
};

export async function SiteHeader() {
	const t = await getTranslations("Nav");
	const items: NavItem[] = [
		{ href: "/pricing", label: t("pricing") }, // turbinekit:payments
		{ href: "/docs", label: t("docs"), external: true }, // turbinekit:docs
	];

	return (
		<header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
			<div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
				<Link href="/" className="font-semibold tracking-tight">
					{site.name}
				</Link>
				<nav aria-label={t("main")} className="hidden gap-1 md:flex">
					{items.map((item) =>
						item.external ? (
							<a
								key={item.href}
								href={item.href}
								className={buttonVariants({ variant: "ghost", size: "sm" })}
							>
								{item.label}
							</a>
						) : (
							<Link
								key={item.href}
								href={item.href}
								className={buttonVariants({ variant: "ghost", size: "sm" })}
							>
								{item.label}
							</Link>
						),
					)}
				</nav>
				<div className="ml-auto flex items-center gap-1">
					<LocaleSwitcher />
					<ThemeToggle />
					<HeaderAccount />
					<MobileNav items={items} />
				</div>
			</div>
		</header>
	);
}
