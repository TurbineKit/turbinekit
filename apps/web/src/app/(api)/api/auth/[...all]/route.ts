import { getAuth } from "@repo/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * better-auth's endpoints: sign-in and sign-up, sessions, passkeys, two
 * factor, and the OAuth server for MCP clients (/api/auth/oauth2/*). Built
 * per request, so the build never needs the auth environment.
 */
export function GET(request: Request) {
	return toNextJsHandler(getAuth()).GET(request);
}

export function POST(request: Request) {
	return toNextJsHandler(getAuth()).POST(request);
}
