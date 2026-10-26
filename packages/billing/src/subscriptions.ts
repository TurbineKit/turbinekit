import { type AnyDb, schema } from "@repo/db";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { type Plan, planOfLookupKey, STRIPE_METADATA } from "./plans.ts";

const { billingSubscription } = schema;

/** Statuses that keep a plan on. past_due: Stripe is still retrying. */
const RUNNING = new Set(["active", "trialing", "past_due"]);

export function isRunning(status: string): boolean {
	return RUNNING.has(status);
}

export type SubscriptionRow = typeof billingSubscription.$inferSelect;

export async function subscriptionsOf(
	db: AnyDb,
	referenceId: string,
): Promise<SubscriptionRow[]> {
	return db
		.select()
		.from(billingSubscription)
		.where(eq(billingSubscription.referenceId, referenceId));
}

/** The plan a user or team has now: a running subscription's, else free. */
export async function planOf(db: AnyDb, referenceId: string): Promise<Plan> {
	const rows = await subscriptionsOf(db, referenceId);
	const running = rows.find((row) => isRunning(row.status));
	return (running?.plan as Plan | undefined) ?? "free";
}

/**
 * Mirrors one subscription into Postgres. It reads the subscription fresh
 * from Stripe, never from an event: events arrive late and out of order, so
 * this is safe to run any number of times. Subscriptions the app didn't
 * create (another product on the same account) are ignored.
 */
export async function syncSubscription(
	db: AnyDb,
	stripe: Stripe,
	subscriptionId: string,
): Promise<void> {
	const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
		expand: ["items.data.price"],
	});
	const referenceId = subscription.metadata?.referenceId;
	if (subscription.metadata?.app !== STRIPE_METADATA.app || !referenceId) {
		return;
	}
	const item = subscription.items.data[0];
	const price = item?.price;
	const plan = planOfLookupKey(price?.lookup_key);
	if (!(item && price && plan)) {
		return;
	}
	const row = {
		referenceId,
		plan,
		status: subscription.status,
		priceId: price.id,
		currentPeriodEnd: item.current_period_end
			? new Date(item.current_period_end * 1000)
			: null,
		cancelAtPeriodEnd:
			subscription.cancel_at_period_end || Boolean(subscription.cancel_at),
	};
	await db
		.insert(billingSubscription)
		.values({ id: subscription.id, ...row })
		.onConflictDoUpdate({ target: billingSubscription.id, set: row });
}
