import type { AnyDb } from "@repo/db";
import type Stripe from "stripe";
import { syncSubscription } from "./subscriptions.ts";

const SUBSCRIPTION_EVENTS = new Set<string>([
	"customer.subscription.created",
	"customer.subscription.updated",
	"customer.subscription.deleted",
	"customer.subscription.paused",
	"customer.subscription.resumed",
]);

/**
 * A Stripe webhook request: checks the signature, then mirrors the
 * subscription the event is about. Each event re-reads the subscription, so
 * a retried or out-of-order event does no harm. A failure answers 500, and
 * Stripe retries.
 */
export async function handleStripeWebhook(
	db: AnyDb,
	stripe: Stripe,
	request: Request,
	secret: string,
): Promise<Response> {
	const signature = request.headers.get("stripe-signature");
	if (!signature) {
		return new Response("Missing Stripe-Signature", { status: 400 });
	}
	let event: Stripe.Event;
	try {
		event = await stripe.webhooks.constructEventAsync(
			await request.text(),
			signature,
			secret,
		);
	} catch {
		return new Response("Invalid signature", { status: 400 });
	}

	if (event.type === "checkout.session.completed") {
		const session = event.data.object;
		const subscription =
			typeof session.subscription === "string"
				? session.subscription
				: session.subscription?.id;
		if (session.mode === "subscription" && subscription) {
			await syncSubscription(db, stripe, subscription);
		}
	} else if (SUBSCRIPTION_EVENTS.has(event.type)) {
		const subscription = event.data.object as Stripe.Subscription;
		await syncSubscription(db, stripe, subscription.id);
	}
	return Response.json({ received: true });
}
