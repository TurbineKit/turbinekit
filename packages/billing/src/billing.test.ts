import { schema } from "@repo/db";
import { createTestDb, insertUser, type TestDb } from "@repo/db/testing";
import { site } from "@repo/site";
import Stripe from "stripe";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { lookupKey, planOfLookupKey } from "./plans.ts";
import { planOf, syncSubscription } from "./subscriptions.ts";
import { handleStripeWebhook } from "./webhook.ts";

const SECRET = "whsec_test_secret";
let db: TestDb;
let close: () => Promise<void>;

// The real client checks signatures offline; subscriptions come from here.
const real = new Stripe("sk_test_fake");
const stored = new Map<string, unknown>();
const stripe = Object.assign(Object.create(real), {
	subscriptions: { retrieve: async (id: string) => stored.get(id) },
}) as Stripe;

function subscription(
	id: string,
	referenceId: string,
	status: string,
	app: string = site.id,
) {
	stored.set(id, {
		id,
		status,
		metadata: { app, referenceId },
		cancel_at_period_end: false,
		cancel_at: null,
		items: {
			data: [
				{
					current_period_end: 1_900_000_000,
					price: { id: "price_123", lookup_key: lookupKey("pro_monthly") },
				},
			],
		},
	});
}

function webhook(payload: object, signature?: string) {
	const body = JSON.stringify(payload);
	return new Request("http://localhost/api/webhooks/stripe", {
		method: "POST",
		body,
		headers: {
			"stripe-signature":
				signature ??
				real.webhooks.generateTestHeaderString({
					payload: body,
					secret: SECRET,
				}),
		},
	});
}

beforeAll(async () => {
	({ db, close } = await createTestDb());
});

afterAll(async () => {
	await close();
});

describe("plans", () => {
	it("maps the app's lookup keys to plans", () => {
		expect(planOfLookupKey(lookupKey("pro_yearly"))).toBe("pro");
		expect(planOfLookupKey("other_pro_monthly")).toBeNull();
		expect(planOfLookupKey(null)).toBeNull();
	});
});

describe("subscriptions", () => {
	it("mirrors a subscription and gives its plan while it runs", async () => {
		const user = await insertUser(db);
		expect(await planOf(db, user.id)).toBe("free");
		subscription("sub_1", user.id, "active");
		await syncSubscription(db, stripe, "sub_1");
		expect(await planOf(db, user.id)).toBe("pro");

		subscription("sub_1", user.id, "canceled");
		await syncSubscription(db, stripe, "sub_1");
		expect(await planOf(db, user.id)).toBe("free");
	});

	it("ignores another product's subscriptions", async () => {
		const user = await insertUser(db);
		subscription("sub_2", user.id, "active", "another-app");
		await syncSubscription(db, stripe, "sub_2");
		const rows = await db.select().from(schema.billingSubscription);
		expect(rows.map((row) => row.id)).not.toContain("sub_2");
	});
});

describe("webhook", () => {
	it("refuses a bad signature", async () => {
		const response = await handleStripeWebhook(
			db,
			stripe,
			webhook({ id: "evt_1" }, "t=1,v1=bad"),
			SECRET,
		);
		expect(response.status).toBe(400);
	});

	it("mirrors the subscription an event is about", async () => {
		const user = await insertUser(db);
		subscription("sub_3", user.id, "trialing");
		const response = await handleStripeWebhook(
			db,
			stripe,
			webhook({
				id: "evt_2",
				object: "event",
				type: "customer.subscription.updated",
				data: { object: { id: "sub_3", object: "subscription" } },
			}),
			SECRET,
		);
		expect(response.status).toBe(200);
		expect(await planOf(db, user.id)).toBe("pro");
	});
});
