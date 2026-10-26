import { type AnyDb, schema } from "@repo/db";
import { eq, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { STRIPE_METADATA } from "./plans.ts";

const { billingCustomer } = schema;

/** Who pays: a user, or a team. */
export type Payer = { referenceId: string; email: string; name?: string };

/** The Stripe customer of a user or team, if it has one yet. */
export async function findCustomer(
	db: AnyDb,
	referenceId: string,
): Promise<string | null> {
	const [row] = await db
		.select({ id: billingCustomer.stripeCustomerId })
		.from(billingCustomer)
		.where(eq(billingCustomer.referenceId, referenceId))
		.limit(1);
	return row?.id ?? null;
}

/**
 * The payer's one Stripe customer, made on their first checkout. A lock per
 * payer makes a second tab wait and reuse the first one's customer, and the
 * idempotency key covers a crash between Stripe and our insert.
 */
export async function ensureCustomer(
	db: AnyDb,
	stripe: Stripe,
	payer: Payer,
): Promise<string> {
	const known = await findCustomer(db, payer.referenceId);
	if (known) {
		return known;
	}
	return db.transaction(async (tx) => {
		await tx.execute(
			sql`select pg_advisory_xact_lock(hashtext(${`customer:${payer.referenceId}`}))`,
		);
		const madeMeanwhile = await findCustomer(tx, payer.referenceId);
		if (madeMeanwhile) {
			return madeMeanwhile;
		}
		const customer = await stripe.customers.create(
			{
				email: payer.email,
				name: payer.name,
				metadata: { ...STRIPE_METADATA, referenceId: payer.referenceId },
			},
			{ idempotencyKey: `customer/${payer.referenceId}` },
		);
		await tx
			.insert(billingCustomer)
			.values({
				referenceId: payer.referenceId,
				stripeCustomerId: customer.id,
			})
			.onConflictDoNothing();
		return customer.id;
	});
}
