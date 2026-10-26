"use server";

import {
	createCheckout,
	createPortal,
	getStripe,
	isPriceKey,
} from "@repo/billing";
import { getDb } from "@repo/db";
import { defaultLocale, isLocale } from "@repo/i18n";
import { siteUrl } from "@repo/site";
import { getPathname } from "@/i18n/navigation";
import { billingSubject } from "@/lib/billing";
import { requireSession } from "@/lib/session";

/** The billing tab's URL. Server actions can't read the locale: pages pass it. */
function billingUrl(locale: string): string {
	const path = getPathname({
		href: "/account/billing",
		locale: isLocale(locale) ? locale : defaultLocale,
	});
	return `${siteUrl()}${path}`;
}

async function manager() {
	const subject = await billingSubject(await requireSession());
	if (!subject.canManage) {
		throw new Error("Only the team's owners and admins manage its billing.");
	}
	return subject;
}

/** A Stripe Checkout URL for the price. The browser goes there. */
export async function startCheckoutAction(
	price: string,
	locale: string,
): Promise<string> {
	if (!isPriceKey(price)) {
		throw new Error("Unknown price.");
	}
	const payer = await manager();
	const back = billingUrl(locale);
	return createCheckout(getDb(), getStripe(), {
		payer,
		price,
		successUrl: `${back}?session_id={CHECKOUT_SESSION_ID}`,
		cancelUrl: back,
	});
}

/** A Stripe customer portal URL: invoices, card, cancellation. */
export async function openPortalAction(locale: string): Promise<string> {
	const { referenceId } = await manager();
	return createPortal(getDb(), getStripe(), {
		referenceId,
		returnUrl: billingUrl(locale),
	});
}
