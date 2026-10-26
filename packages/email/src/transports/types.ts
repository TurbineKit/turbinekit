export type OutgoingEmail = {
	from: string;
	to: string;
	subject: string;
	html: string;
	text: string;
	replyTo?: string;
};

/** One way to deliver email. The console transport is the fallback. */
export type Transport = {
	name: string;
	send(email: OutgoingEmail): Promise<{ id: string | null }>;
};
