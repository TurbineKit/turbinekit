"use client";

import { Button } from "@repo/ui/components/button";
import { useLocale } from "next-intl";
import { useState } from "react";
import { stopImpersonatingAction } from "@/app/[locale]/(app)/admin/actions";
import { getPathname } from "@/i18n/navigation";

/** Back to the admin's own session; the app reloads with it. */
export function StopImpersonating({ label }: { label: string }) {
	const locale = useLocale();
	const [pending, setPending] = useState(false);
	return (
		<Button
			size="sm"
			variant="outline"
			disabled={pending}
			onClick={async () => {
				setPending(true);
				await stopImpersonatingAction();
				window.location.assign(getPathname({ href: "/admin", locale }));
			}}
		>
			{label}
		</Button>
	);
}
