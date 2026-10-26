import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Stripe settings, validated on first use. Without a secret key, billing is
 * off: the pricing page still shows, and checkout says it isn't available.
 */
export function keys() {
	return createEnv({
		server: {
			/** sk_test_… or sk_live_… (a restricted rk_… key works too). */
			STRIPE_SECRET_KEY: z
				.string()
				.regex(/^(sk|rk)_/)
				.optional(),
			/** whsec_…: from `stripe listen` locally, the dashboard in production. */
			STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
		},
		runtimeEnv: process.env,
		emptyStringAsUndefined: true,
		skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
	});
}
