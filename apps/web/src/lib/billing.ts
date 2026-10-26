import { getAuth, type Session } from "@repo/auth";
import type { Payer, PRICES } from "@repo/billing";
import { headers } from "next/headers";
import type { createFormatter } from "next-intl";

export type BillingSubject = Payer & {
	/** The team's name when a team pays. */
	team: string | null;
	/** Owners and admins manage a team's billing; everyone manages their own. */
	canManage: boolean;
};

/** Who pays in the current space: the active team, or the user. */
export async function billingSubject(
	session: Session,
): Promise<BillingSubject> {
	// #region turbinekit:orgs
	if (session.session.activeOrganizationId) {
		const team = await getAuth().api.getFullOrganization({
			headers: await headers(),
		});
		const role = team?.members.find(
			(member) => member.userId === session.user.id,
		)?.role;
		return {
			referenceId: session.session.activeOrganizationId,
			email: session.user.email,
			name: team?.name,
			team: team?.name ?? null,
			canManage: role === "owner" || role === "admin",
		};
	}
	// #endregion turbinekit:orgs
	return {
		referenceId: session.user.id,
		email: session.user.email,
		name: session.user.name,
		team: null,
		canManage: true,
	};
}

/** A price as people read it: "$10", "10 €". */
export function priceLabel(
	format: ReturnType<typeof createFormatter>,
	price: (typeof PRICES)[keyof typeof PRICES],
): string {
	return format.number(price.amount / 100, {
		style: "currency",
		currency: price.currency,
		maximumFractionDigits: price.amount % 100 === 0 ? 0 : 2,
	});
}
