import { Resend } from "resend";
import { keys } from "../keys.ts";
import type { Transport } from "./types.ts";

let client: Resend | undefined;

/** Resend, when RESEND_API_KEY is set. */
export function resendTransport(): Transport | null {
	const { RESEND_API_KEY } = keys();
	if (!RESEND_API_KEY) {
		return null;
	}
	client ??= new Resend(RESEND_API_KEY);
	const resend = client;
	return {
		name: "resend",
		async send({ from, to, subject, html, text, replyTo }) {
			const { data, error } = await resend.emails.send({
				from,
				to,
				subject,
				html,
				text,
				replyTo,
			});
			if (error) {
				throw new Error(
					`Resend refused the email: ${error.name}: ${error.message}`,
				);
			}
			return { id: data?.id ?? null };
		},
	};
}
