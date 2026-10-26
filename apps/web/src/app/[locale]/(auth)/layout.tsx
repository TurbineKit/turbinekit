import { site } from "@repo/site";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
	robots: { index: false, follow: false },
};

/** Sign-in, sign-up and account recovery: a centered form, no site chrome. */
export default function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-dvh flex-col">
			<header className="flex h-14 items-center justify-between px-4">
				<Link href="/" className="font-semibold tracking-tight">
					{site.name}
				</Link>
				<div className="flex items-center gap-1">
					<LocaleSwitcher />
					<ThemeToggle />
				</div>
			</header>
			<div className="flex flex-1 items-center justify-center px-4 py-12">
				{children}
			</div>
		</div>
	);
}
