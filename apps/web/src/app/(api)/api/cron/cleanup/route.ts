import { getDb, schema } from "@repo/db";
import { lt } from "drizzle-orm";
import { isCronRequest } from "@/lib/service-auth";

/**
 * Daily housekeeping (scheduled in vercel.ts): removes expired sessions and
 * verification tokens. Vercel Cron calls it with CRON_SECRET.
 */
export async function GET(request: Request) {
	if (!isCronRequest(request)) {
		return new Response("Unauthorized", { status: 401 });
	}
	const db = getDb();
	const now = new Date();
	const sessions = await db
		.delete(schema.session)
		.where(lt(schema.session.expiresAt, now))
		.returning({ id: schema.session.id });
	const verifications = await db
		.delete(schema.verification)
		.where(lt(schema.verification.expiresAt, now))
		.returning({ id: schema.verification.id });
	return Response.json({
		sessions: sessions.length,
		verifications: verifications.length,
	});
}
