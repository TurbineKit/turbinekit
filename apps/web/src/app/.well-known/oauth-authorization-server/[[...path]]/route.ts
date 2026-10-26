import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import { getAuth } from "@repo/auth";
import { connection } from "next/server";

/**
 * The authorization server's metadata (RFC 8414) where MCP clients look for
 * it: the issuer is <site>/api/auth, so the path is
 * /.well-known/oauth-authorization-server/api/auth.
 */
export async function GET(request: Request) {
	await connection();
	return oauthProviderAuthServerMetadata(getAuth())(request);
}
