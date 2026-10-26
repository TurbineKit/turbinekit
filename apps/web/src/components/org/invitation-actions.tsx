"use client";

import { Button } from "@repo/ui/components/button";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

/** Accept (the team becomes the active one) or decline an invitation. */
export function InvitationActions({ id }: { id: string }) {
	const t = useTranslations("Org");
	const router = useRouter();
	const [pending, setPending] = useState(false);

	const answer = async (accept: boolean) => {
		setPending(true);
		const { data, error } = accept
			? await authClient.organization.acceptInvitation({ invitationId: id })
			: await authClient.organization.rejectInvitation({ invitationId: id });
		if (accept && data?.invitation) {
			// Also refreshes the session cookie, so pages see the team.
			await authClient.organization.setActive({
				organizationId: data.invitation.organizationId,
			});
		}
		setPending(false);
		if (error) {
			toast.error(error.message ?? t("error"));
			return;
		}
		if (!accept) {
			toast.success(t("invitation.declined"));
		}
		router.push(accept ? "/org" : "/dashboard");
		router.refresh();
	};

	return (
		<div className="flex gap-2">
			<Button disabled={pending} onClick={() => answer(true)}>
				{t("invitation.accept")}
			</Button>
			<Button
				variant="outline"
				disabled={pending}
				onClick={() => answer(false)}
			>
				{t("invitation.decline")}
			</Button>
		</div>
	);
}
