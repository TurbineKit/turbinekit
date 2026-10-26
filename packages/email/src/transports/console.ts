import type { OutgoingEmail, Transport } from "./types.ts";

export type MailboxEntry = OutgoingEmail & { sentAt: string };

// Kept on globalThis so every module instance in the dev server shares it.
const store = globalThis as unknown as { __devMailbox?: MailboxEntry[] };

/**
 * Prints each email to the server log instead of sending it, and keeps the
 * last 50 in memory: the dev mailbox (/api/dev/mailbox) and the e2e tests
 * read verification links from there.
 */
export const consoleTransport: Transport = {
	name: "console",
	async send(email) {
		store.__devMailbox ??= [];
		store.__devMailbox.unshift({ ...email, sentAt: new Date().toISOString() });
		store.__devMailbox.length = Math.min(store.__devMailbox.length, 50);
		console.info(
			`[email:dev] to=${email.to} subject=${JSON.stringify(email.subject)}\n${email.text}`,
		);
		return { id: null };
	},
};

/** Emails the console transport sent, newest first, optionally for one address. */
export function readMailbox(to?: string): MailboxEntry[] {
	const all = store.__devMailbox ?? [];
	return to
		? all.filter((email) => email.to.toLowerCase() === to.toLowerCase())
		: all;
}
