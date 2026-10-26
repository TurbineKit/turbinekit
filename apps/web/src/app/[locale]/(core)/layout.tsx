import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/** The public site: header, page, footer. */
export default function CoreLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-dvh flex-col">
			<SiteHeader />
			<div className="flex-1">{children}</div>
			<SiteFooter />
		</div>
	);
}
