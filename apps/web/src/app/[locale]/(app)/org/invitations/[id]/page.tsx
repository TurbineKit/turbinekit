import { getAuth } from "@repo/auth";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { InvitationActions } from "@/components/org/invitation-actions";
import { requireSession } from "@/lib/session";

type Props = { params: Promise<{ id: string }> };

// Opened from an email, never by a link in the app: no instant navigation
// to keep, so the route opts out of the check.
export const instant = false;

/**
 * Where an invitation email leads. Signed-out visitors go through sign-in
 * first (proxy.ts); better-auth checks that the invitation is for them.
 */
export default function InvitationPage({ params }: Props) {
	return (
		<div className="mx-auto w-full max-w-md py-8">
			<Suspense fallback={<Skeleton className="h-48" />}>
				<Invitation params={params} />
			</Suspense>
		</div>
	);
}

async function Invitation({ params }: Props) {
	const { id } = await params;
	const session = await requireSession();
	const t = await getTranslations("Org");
	const invitation = await getAuth()
		.api.getInvitation({ query: { id }, headers: await headers() })
		.catch(() => null);

	if (!invitation) {
		return (
			<Alert variant="destructive">
				<AlertDescription>
					{t("invitation.invalid", { email: session.user.email })}
				</AlertDescription>
			</Alert>
		);
	}

	const role =
		invitation.role === "owner" || invitation.role === "admin"
			? invitation.role
			: "member";
	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{t("invitation.title", { team: invitation.organizationName })}
				</CardTitle>
				<CardDescription>
					{t("invitation.body", {
						inviter: invitation.inviterEmail,
						team: invitation.organizationName,
						role: t(`members.roles.${role}`),
					})}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<InvitationActions id={invitation.id} />
			</CardContent>
		</Card>
	);
}
