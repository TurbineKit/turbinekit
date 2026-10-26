import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function LegalLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-dvh flex-col">
			<SiteHeader />
			<div className="flex-1">{children}</div>
			<SiteFooter />
		</div>
	);
}
