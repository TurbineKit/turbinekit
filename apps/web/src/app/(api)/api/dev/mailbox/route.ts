import { readMailbox } from "@repo/email";
import { keys } from "@repo/email/keys";
import { connection } from "next/server";

/**
 * The dev mailbox: emails the console transport printed instead of sending,
 * newest first (`?to=` filters by recipient). Open only in development or
 * with EMAIL_TRANSPORT=console (CI, e2e tests); a 404 everywhere else.
 */
export async function GET(request: Request) {
	// Answered per request: the build must not freeze a 404 here.
	await connection();
	const enabled =
		process.env.NODE_ENV === "development" ||
		keys().EMAIL_TRANSPORT === "console";
	if (!enabled) {
		return new Response("Not found", { status: 404 });
	}
	const to = new URL(request.url).searchParams.get("to") ?? undefined;
	return Response.json(
		readMailbox(to).map(({ to, subject, text, sentAt }) => ({
			to,
			subject,
			text,
			sentAt,
		})),
	);
}
