import { Separator } from "@repo/ui/components/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@repo/ui/components/sidebar";
import type { Metadata } from "next";
import { type ReactNode, Suspense } from "react";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner"; // turbinekit:admin
import { AnalyticsIdentify } from "@/components/analytics-identify"; // turbinekit:analytics
import { AppSidebar } from "@/components/app/app-sidebar";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
	robots: { index: false, follow: false },
};

/**
 * The signed-in app. The shell is static; each page reads the session
 * inside a <Suspense> boundary (lib/session.ts), and the proxy already sent
 * signed-out visitors to sign-in.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
	return (
		<SidebarProvider>
			{/* #region turbinekit:analytics */}
			<AnalyticsIdentify />
			{/* #endregion turbinekit:analytics */}
			<AppSidebar />
			<SidebarInset>
				{/* #region turbinekit:admin */}
				<Suspense>
					<ImpersonationBanner />
				</Suspense>
				{/* #endregion turbinekit:admin */}
				<header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator orientation="vertical" className="mr-2 h-4" />
					<div className="ml-auto flex items-center gap-1">
						<LocaleSwitcher />
						<ThemeToggle />
					</div>
				</header>
				<div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
					{children}
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
