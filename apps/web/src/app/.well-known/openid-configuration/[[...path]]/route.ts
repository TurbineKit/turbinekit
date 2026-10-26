import { oauthProviderOpenIdConfigMetadata } from "@better-auth/oauth-provider";
import { getAuth } from "@repo/auth";
import { connection } from "next/server";

/** OpenID discovery, for clients that look there instead of RFC 8414. */
export async function GET(request: Request) {
	await connection();
	return oauthProviderOpenIdConfigMetadata(getAuth())(request);
}
