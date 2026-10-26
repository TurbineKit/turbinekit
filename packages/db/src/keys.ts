import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * The database settings, validated on first use, so a build with no
 * environment never fails here. `DATABASE_URL` is the pooled connection the
 * app uses; migrations prefer `DATABASE_URL_UNPOOLED` when the provider has a
 * pooler (Neon, Supabase, PlanetScale).
 */
export function keys() {
	return createEnv({
		server: {
			DATABASE_URL: z.url(),
			DATABASE_URL_UNPOOLED: z.url().optional(),
			/** Connections in the app's pool. Set 1 with `pnpm db:local` (PGlite). */
			DATABASE_POOL_MAX: z.coerce.number().int().positive().optional(),
		},
		runtimeEnv: process.env,
		emptyStringAsUndefined: true,
		skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
	});
}
