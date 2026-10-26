"use client";

import { Button } from "@repo/ui/components/button";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
	openPortalAction,
	startCheckoutAction,
} from "@/app/[locale]/(app)/account/billing/actions";

/** Upgrade (Stripe Checkout) and manage (the customer portal) buttons. */
export function BillingActions({
	pro,
	hasCustomer,
	prices,
}: {
	pro: boolean;
	hasCustomer: boolean;
	prices: { monthly: string; yearly: string };
}) {
	const t = useTranslations("Account.billing");
	const locale = useLocale();
	const [pending, setPending] = useState(false);

	/** Both actions return a Stripe URL; the browser goes there. */
	const go = async (action: () => Promise<string>) => {
		setPending(true);
		try {
			window.location.assign(await action());
		} catch (error) {
			toast.error(t("error", { message: (error as Error).message }));
			setPending(false);
		}
	};

	return (
		<div className="flex flex-wrap gap-2">
			{!pro && (
				<>
					<Button
						disabled={pending}
						onClick={() => go(() => startCheckoutAction("pro_monthly", locale))}
					>
						{t("upgradeMonthly", { price: prices.monthly })}
					</Button>
					<Button
						variant="outline"
						disabled={pending}
						onClick={() => go(() => startCheckoutAction("pro_yearly", locale))}
					>
						{t("upgradeYearly", { price: prices.yearly })}
					</Button>
				</>
			)}
			{hasCustomer && (
				<Button
					variant="outline"
					disabled={pending}
					onClick={() => go(() => openPortalAction(locale))}
				>
					{t("manage")}
				</Button>
			)}
		</div>
	);
}
