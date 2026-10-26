import { site, siteUrl } from "@repo/site";
import { ALL_SCOPES, type Scope } from "./permissions.ts";

/**
 * OAuth for the MCP server. better-auth is the authorization server (the
 * `mcp()` and `cimd()` plugins in server.ts) and /mcp is the protected
 * resource. This file has no better-auth import, so the MCP route can use it
 * without loading auth.
 */

/** The MCP server's URL: every access token is bound to it (RFC 8707). */
export function mcpResource(): string {
	return `${siteUrl()}/mcp`;
}

/** The authorization server's issuer: better-auth's base URL and path. */
export function oauthIssuer(): string {
	return `${siteUrl()}/api/auth`;
}

/** Every scope the authorization server knows. */
export const OAUTH_SCOPES: ("offline_access" | Scope)[] = [
	"offline_access",
	...ALL_SCOPES,
];

/** What an MCP client reads to find where to sign the user in (RFC 9728). */
export function protectedResourceMetadata() {
	return {
		resource: mcpResource(),
		resource_name: site.name,
		authorization_servers: [oauthIssuer()],
		scopes_supported: OAUTH_SCOPES,
		bearer_methods_supported: ["header"],
		resource_documentation: `${siteUrl()}/llms.txt`,
	};
}
