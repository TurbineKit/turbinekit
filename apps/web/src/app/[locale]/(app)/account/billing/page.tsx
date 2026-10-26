import {
	confirmCheckout,
	findCustomer,
	getStripe,
	isBillingConfigured,
	isRunning,
	PRICES,
	subscriptionsOf,
} from "@repo/billing";
import { getDb } from "@repo/db";
import { Skeleton } from "@repo/ui/components/skeleton";
import { getFormatter, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { BillingActions } from "@/components/account/billing-actions";
import { Section } from "@/components/account/section";
import { billingSubject, priceLabel } from "@/lib/billing";
import { requireSession } from "@/lib/session";

type Props = { searchParams: Promise<{ session_id?: string }> };

export default function BillingPage({ searchParams }: Props) {
	return (
		<Suspense fallback={<Skeleton className="h-40" />}>
			<Billing searchParams={searchParams} />
		</Suspense>
	);
}

async function Billing({ searchParams }: Props) {
	const session = await requireSession();
	const t = await getTranslations("Account.billing");
	if (!isBillingConfigured()) {
		return (
			<Section title={t("title")} description={t("description")}>
				<p className="text-sm text-muted-foreground">{t("unavailable")}</p>
			</Section>
		);
	}

	const db = getDb();
	const subject = await billingSubject(session);
	const { session_id: sessionId } = await searchParams;
	if (sessionId?.startsWith("cs_")) {
		// Back from Checkout: the webhook may come later, so mirror it now.
		await confirmCheckout(db, getStripe(), {
			referenceId: subject.referenceId,
			sessionId,
		}).catch((error: unknown) => {
			console.error("[billing] checkout confirmation failed", error);
		});
	}
	const subscriptions = await subscriptionsOf(db, subject.referenceId);
	const running = subscriptions.find((row) => isRunning(row.status));
	const format = await getFormatter();
	const until = running?.currentPeriodEnd
		? format.dateTime(running.currentPeriodEnd, { dateStyle: "long" })
		: null;

	return (
		<Section
			title={t("title")}
			description={
				subject.team
					? t("teamDescription", { team: subject.team })
					: t("description")
			}
		>
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-1 text-sm">
					<p className="font-medium">{running ? t("pro") : t("free")}</p>
					{running?.status === "past_due" && (
						<p className="text-destructive">{t("pastDue")}</p>
					)}
					{until && (
						<p className="text-muted-foreground">
							{running?.cancelAtPeriodEnd
								? t("ends", { date: until })
								: t("renews", { date: until })}
						</p>
					)}
				</div>
				{subject.canManage ? (
					<BillingActions
						pro={Boolean(running)}
						hasCustomer={Boolean(await findCustomer(db, subject.referenceId))}
						prices={{
							monthly: priceLabel(format, PRICES.pro_monthly),
							yearly: priceLabel(format, PRICES.pro_yearly),
						}}
					/>
				) : (
					<p className="text-sm text-muted-foreground">{t("managers")}</p>
				)}
			</div>
		</Section>
	);
}
