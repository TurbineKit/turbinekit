import { site } from "@repo/site";

/**
 * The plans and what each allows. `free` is everyone without a running
 * subscription. Raise a limit to Infinity to lift it.
 */
export const PLANS = {
	free: { limits: { projects: 3 } },
	pro: { limits: { projects: Number.POSITIVE_INFINITY } },
} as const;

export type Plan = keyof typeof PLANS;

/**
 * What Stripe sells. `pnpm stripe:setup` creates these prices; the app finds
 * them by lookup key, so the same code runs in test and live mode. The
 * pricing page shows these amounts: change them here, then run the script.
 */
export const PRICES = {
	pro_monthly: {
		plan: "pro",
		interval: "month",
		amount: 1000,
		currency: "usd",
	},
	pro_yearly: { plan: "pro", interval: "year", amount: 10000, currency: "usd" },
} as const satisfies Record<
	string,
	{ plan: Plan; interval: "month" | "year"; amount: number; currency: string }
>;

export type PriceKey = keyof typeof PRICES;

export function isPriceKey(value: unknown): value is PriceKey {
	return typeof value === "string" && value in PRICES;
}

/** Prefixed with the site id, so products can share a Stripe account. */
export function lookupKey(price: PriceKey): string {
	return `${site.id}_${price}`;
}

/** The plan a Stripe price sells, from its lookup key. */
export function planOfLookupKey(key: string | null | undefined): Plan | null {
	const price = key?.startsWith(`${site.id}_`)
		? key.slice(site.id.length + 1)
		: null;
	return isPriceKey(price) ? PRICES[price].plan : null;
}

/** Stamped on what the app creates in Stripe; webhooks ignore everything else. */
export const STRIPE_METADATA = { app: site.id } as const;
