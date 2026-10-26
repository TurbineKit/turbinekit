import type { AnyDb } from "@repo/db";
import type Stripe from "stripe";
import { ensureCustomer, findCustomer, type Payer } from "./customer.ts";
import { lookupKey, type PriceKey, STRIPE_METADATA } from "./plans.ts";
import { syncSubscription } from "./subscriptions.ts";

const priceIds = new Map<PriceKey, { id: string; at: number }>();

/** A price's Stripe id, found by lookup key. Cached: it changes about never. */
export async function priceIdFor(
	stripe: Stripe,
	price: PriceKey,
): Promise<string> {
	const hit = priceIds.get(price);
	if (hit && Date.now() - hit.at < 10 * 60_000) {
		return hit.id;
	}
	const { data } = await stripe.prices.list({
		lookup_keys: [lookupKey(price)],
		active: true,
		limit: 1,
	});
	const found = data[0];
	if (!found) {
		throw new Error(
			`No active Stripe price has the lookup key ${lookupKey(price)}. Run pnpm stripe:setup.`,
		);
	}
	priceIds.set(price, { id: found.id, at: Date.now() });
	return found.id;
}

/** A Stripe Checkout page for a subscription. Returns its URL. */
export async function createCheckout(
	db: AnyDb,
	stripe: Stripe,
	{
		payer,
		price,
		successUrl,
		cancelUrl,
	}: { payer: Payer; price: PriceKey; successUrl: string; cancelUrl: string },
): Promise<string> {
	const customer = await ensureCustomer(db, stripe, payer);
	const metadata = { ...STRIPE_METADATA, referenceId: payer.referenceId };
	const session = await stripe.checkout.sessions.create({
		mode: "subscription",
		customer,
		client_reference_id: payer.referenceId,
		line_items: [{ price: await priceIdFor(stripe, price), quantity: 1 }],
		allow_promotion_codes: true,
		success_url: successUrl,
		cancel_url: cancelUrl,
		metadata,
		subscription_data: { metadata },
	});
	if (!session.url) {
		throw new Error("Stripe returned no checkout URL.");
	}
	return session.url;
}

/** The Stripe customer portal: invoices, payment method, cancellation. */
export async function createPortal(
	db: AnyDb,
	stripe: Stripe,
	{ referenceId, returnUrl }: { referenceId: string; returnUrl: string },
): Promise<string> {
	const customer = await findCustomer(db, referenceId);
	if (!customer) {
		throw new Error("There is no billing account yet.");
	}
	const session = await stripe.billingPortal.sessions.create({
		customer,
		return_url: returnUrl,
	});
	return session.url;
}

/**
 * Back from Checkout: mirrors the new subscription now, so the page shows
 * it before the webhook arrives. Only for the payer's own session.
 */
export async function confirmCheckout(
	db: AnyDb,
	stripe: Stripe,
	{ referenceId, sessionId }: { referenceId: string; sessionId: string },
): Promise<void> {
	const session = await stripe.checkout.sessions.retrieve(sessionId);
	if (session.metadata?.referenceId !== referenceId) {
		return;
	}
	const subscription =
		typeof session.subscription === "string"
			? session.subscription
			: session.subscription?.id;
	if (subscription) {
		await syncSubscription(db, stripe, subscription);
	}
}
