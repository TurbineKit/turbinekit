import { createEmailClient } from "@opencoredev/email-sdk";
import { postmark } from "@opencoredev/email-sdk/postmark";
import { resend } from "@opencoredev/email-sdk/resend";
import { smtp } from "@opencoredev/email-sdk/smtp";
import { keys } from "../keys.ts";
import type { Transport } from "./types.ts";

/**
 * Email SDK (email-sdk.dev): one client over the providers you configure, in
 * this order, falling back to the next when a delivery is known to fail. Add
 * an adapter here to use another of its 27 providers.
 */
export function emailSdkTransport(): Transport | null {
	const env = keys();
	const adapters = [
		env.RESEND_API_KEY ? resend({ apiKey: env.RESEND_API_KEY }) : null,
		env.POSTMARK_SERVER_TOKEN
			? postmark({ serverToken: env.POSTMARK_SERVER_TOKEN })
			: null,
		env.SMTP_HOST
			? smtp({
					host: env.SMTP_HOST,
					port: env.SMTP_PORT ?? 587,
					auth:
						env.SMTP_USER && env.SMTP_PASSWORD
							? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
							: undefined,
				})
			: null,
	].filter((adapter) => adapter !== null);

	const [first, ...rest] = adapters;
	if (!first) {
		return null;
	}
	const client = createEmailClient({
		adapters,
		defaultAdapter: first.name,
		fallback: { adapters: rest.map((adapter) => adapter.name) },
		retry: { maxAttempts: 2 },
	});
	return {
		name: `email-sdk:${first.name}`,
		async send({ from, to, subject, html, text, replyTo }) {
			const result = await client.send({
				from,
				to,
				subject,
				html,
				text,
				replyTo,
			});
			return { id: result.id ?? null };
		},
	};
}
