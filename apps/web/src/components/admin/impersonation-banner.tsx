import { getTranslations } from "next-intl/server";
import { StopImpersonating } from "@/components/admin/stop-impersonating";
import { getSession } from "@/lib/session";

/**
 * Shown while an admin views the app as someone else, with the way back.
 * Reads the session, so render it inside <Suspense>.
 */
export async function ImpersonationBanner() {
	const session = await getSession();
	if (!session?.session.impersonatedBy) {
		return null;
	}
	const t = await getTranslations("Admin.impersonating");
	return (
		<div className="flex flex-wrap items-center justify-center gap-3 bg-amber-400 px-4 py-2 text-sm text-black">
			<span>
				{t("banner", { name: session.user.name, email: session.user.email })}
			</span>
			<StopImpersonating label={t("stop")} />
		</div>
	);
}
