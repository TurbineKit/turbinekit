import { timingSafeEqual } from "node:crypto";

/**
 * Whether a request comes from the scheduler: Vercel Cron sends CRON_SECRET
 * as a bearer token. Compared in constant time. Without CRON_SECRET, cron
 * routes refuse everything.
 */
export function isCronRequest(request: Request): boolean {
	const secret = process.env.CRON_SECRET?.trim();
	const header = request.headers.get("authorization") ?? "";
	if (!secret) {
		return false;
	}
	const expected = Buffer.from(`Bearer ${secret}`);
	const given = Buffer.from(header);
	return given.length === expected.length && timingSafeEqual(given, expected);
}
