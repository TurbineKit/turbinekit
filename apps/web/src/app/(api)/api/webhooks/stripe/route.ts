import {
	getStripe,
	handleStripeWebhook,
	isBillingConfigured,
} from "@repo/billing";
import { keys } from "@repo/billing/keys";
import { getDb } from "@repo/db";

/**
 * Stripe's webhook: keeps billing_subscription in step with Stripe. Point a
 * Stripe endpoint (or `stripe listen`) here, with the events
 * checkout.session.completed and customer.subscription.*.
 */
export async function POST(request: Request) {
	const secret = keys().STRIPE_WEBHOOK_SECRET;
	if (!(secret && isBillingConfigured())) {
		return new Response("Billing is not configured", { status: 404 });
	}
	return handleStripeWebhook(getDb(), getStripe(), request, secret);
}
