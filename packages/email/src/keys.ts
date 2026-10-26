import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Email settings, validated on first use. With no provider configured, emails
 * are printed to the server log in development (and kept in the dev mailbox),
 * and refused in production, so a missing key never swallows real mail.
 */
export function keys() {
	return createEnv({
		server: {
			/** The sender, for example `Acme <hello@mail.acme.com>`. */
			EMAIL_FROM: z.string().min(3).optional(),
			/** `console` prints every email instead of sending it (local, CI, e2e). */
			EMAIL_TRANSPORT: z.enum(["console"]).optional(),
			RESEND_API_KEY: z.string().startsWith("re_").optional(),
			// #region turbinekit:email-sdk
			POSTMARK_SERVER_TOKEN: z.string().optional(),
			SMTP_HOST: z.string().optional(),
			SMTP_PORT: z.coerce.number().int().positive().optional(),
			SMTP_USER: z.string().optional(),
			SMTP_PASSWORD: z.string().optional(),
			// #endregion turbinekit:email-sdk
		},
		runtimeEnv: process.env,
		emptyStringAsUndefined: true,
		skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
	});
}
