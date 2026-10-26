import "@repo/db/load-env";
import { site } from "@repo/site";
import Stripe from "stripe";
import {
	lookupKey,
	PRICES,
	type PriceKey,
	STRIPE_METADATA,
} from "../src/plans.ts";

/**
 * `pnpm stripe:setup`: creates the products and prices of src/plans.ts in
 * the Stripe account of STRIPE_SECRET_KEY. Run it with a test key first,
 * then once with the live key. Safe to run again: it keeps what exists.
 */
const secret = process.env.STRIPE_SECRET_KEY;
if (!secret) {
	console.error(
		"Set STRIPE_SECRET_KEY in apps/web/.env.local first (a test key: sk_test_…).",
	);
	process.exit(1);
}
const stripe = new Stripe(secret);
const mode = secret.includes("_live_") ? "LIVE" : "test";
console.log(`Stripe ${mode} mode`);

const products = await stripe.products.list({ active: true, limit: 100 });

async function productFor(plan: string): Promise<string> {
	const existing = products.data.find(
		(product) =>
			product.metadata.app === STRIPE_METADATA.app &&
			product.metadata.plan === plan,
	);
	if (existing) {
		return existing.id;
	}
	const product = await stripe.products.create({
		name: `${site.name} ${plan.charAt(0).toUpperCase()}${plan.slice(1)}`,
		metadata: { ...STRIPE_METADATA, plan },
	});
	products.data.push(product);
	console.log(`+ product ${product.name} (${product.id})`);
	return product.id;
}

for (const [name, price] of Object.entries(PRICES)) {
	const key = lookupKey(name as PriceKey);
	const { data } = await stripe.prices.list({ lookup_keys: [key], limit: 1 });
	if (data[0]) {
		console.log(`= ${key} exists (${data[0].id})`);
		continue;
	}
	const created = await stripe.prices.create({
		product: await productFor(price.plan),
		unit_amount: price.amount,
		currency: price.currency,
		recurring: { interval: price.interval },
		lookup_key: key,
		metadata: { ...STRIPE_METADATA },
	});
	console.log(`+ ${key} (${created.id})`);
}

console.log(`
Next, the webhook (it keeps plans in sync):
- Locally: stripe listen --forward-to localhost:3000/api/webhooks/stripe
  and set STRIPE_WEBHOOK_SECRET to the whsec_… it prints.
- In production: add an endpoint for <site>/api/webhooks/stripe with the
  events checkout.session.completed and customer.subscription.*, then set
  STRIPE_WEBHOOK_SECRET to its signing secret.
- Turn on the customer portal: Settings → Billing → Customer portal.`);
