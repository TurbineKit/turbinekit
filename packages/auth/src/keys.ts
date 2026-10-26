import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Auth settings, validated on first use. Google and GitHub sign-in turn on
 * only when both their keys are set.
 */
export function keys() {
	return createEnv({
		server: {
			/** At least 32 random characters: `openssl rand -base64 32`. */
			BETTER_AUTH_SECRET: z.string().min(32),
			/** Extra origins allowed to call auth, comma-separated. */
			BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional(),
			GOOGLE_CLIENT_ID: z.string().optional(),
			GOOGLE_CLIENT_SECRET: z.string().optional(),
			GITHUB_CLIENT_ID: z.string().optional(),
			GITHUB_CLIENT_SECRET: z.string().optional(),
		},
		runtimeEnv: process.env,
		emptyStringAsUndefined: true,
		skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
	});
}
