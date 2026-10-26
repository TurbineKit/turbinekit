import { site } from "@repo/site";
import Stripe from "stripe";
import { keys } from "./keys.ts";

/** Thrown when Stripe isn't set up, so callers can say billing is unavailable. */
export class BillingNotConfiguredError extends Error {
	constructor(missing: string) {
		super(`Billing is not configured: set ${missing}.`);
		this.name = "BillingNotConfiguredError";
	}
}

export function isBillingConfigured(): boolean {
	return Boolean(keys().STRIPE_SECRET_KEY);
}

let instance: Stripe | undefined;

/**
 * The Stripe client, made on first use, so a build needs no key. It uses the
 * API version its SDK release pins: upgrading the SDK moves the version.
 */
export function getStripe(): Stripe {
	if (instance) {
		return instance;
	}
	const key = keys().STRIPE_SECRET_KEY;
	if (!key) {
		throw new BillingNotConfiguredError("STRIPE_SECRET_KEY");
	}
	instance = new Stripe(key, {
		httpClient: Stripe.createFetchHttpClient(),
		appInfo: { name: site.name },
		maxNetworkRetries: 2,
	});
	return instance;
}
