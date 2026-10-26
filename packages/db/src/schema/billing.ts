import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Billing state, mirrored from Stripe (packages/billing). A `referenceId` is
 * whoever pays: a user (`usr_…`) or a team (`org_…`). Stripe stays the
 * source of truth: webhooks and the checkout return page refresh these rows.
 */

/** The one Stripe customer of each user or team. */
export const billingCustomer = pgTable("billing_customer", {
	referenceId: text("reference_id").primaryKey(),
	stripeCustomerId: text("stripe_customer_id").notNull().unique(),
	createdAt: timestamp("created_at", { withTimezone: true, precision: 3 })
		.notNull()
		.defaultNow(),
});

/** A Stripe subscription, keyed by its Stripe id (`sub_…`). */
export const billingSubscription = pgTable(
	"billing_subscription",
	{
		id: text("id").primaryKey(),
		referenceId: text("reference_id").notNull(),
		/** The plan in packages/billing plans.ts, e.g. `pro`. */
		plan: text("plan").notNull(),
		/** Stripe's status: active, trialing, past_due, canceled… */
		status: text("status").notNull(),
		priceId: text("price_id").notNull(),
		currentPeriodEnd: timestamp("current_period_end", {
			withTimezone: true,
			precision: 3,
		}),
		cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
		createdAt: timestamp("created_at", { withTimezone: true, precision: 3 })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("billing_subscription_reference_idx").on(table.referenceId),
	],
);
