import { protectedResourceMetadata } from "@repo/auth/oauth";
import { connection } from "next/server";

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "*",
};

/**
 * The MCP server's protected resource metadata (RFC 9728), at
 * /.well-known/oauth-protected-resource and …/mcp: it tells an MCP client
 * which authorization server signs users in (better-auth, /api/auth).
 */
export async function GET() {
	await connection();
	return Response.json(protectedResourceMetadata(), {
		headers: { ...CORS, "Cache-Control": "public, max-age=3600" },
	});
}

export function OPTIONS() {
	return new Response(null, { status: 204, headers: CORS });
}
