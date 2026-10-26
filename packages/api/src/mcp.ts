import type { McpServer } from "@modelcontextprotocol/server";
import { mcpResource, OAUTH_SCOPES } from "@repo/auth/oauth";
import { getDb } from "@repo/db";
import { site, siteUrl } from "@repo/site";
import { createMcpHandler } from "mcp-handler";
import {
	callerFromAccessToken,
	callerFromApiKey,
	credentialOf,
	isApiKey,
} from "./authenticate.ts";
import type { Caller } from "./context.ts";
import { ApiError } from "./errors.ts";
import { newRequestId } from "./http.ts";
import { allOperations } from "./operations/index.ts";

/** Reported to clients as the server's version. Raise it when tools change. */
export const MCP_SERVER_VERSION = "1.0.0";

/** Tool calls are small; a larger body is a mistake or an attack. */
const MAX_BODY_BYTES = 64 * 1024;

const INSTRUCTIONS = `${site.name}: ${site.description}
These tools act on the signed-in user's account. Projects are the user's own (or their team's). Ask before deleting anything.`;

/**
 * Offers each operation that has `mcp` metadata as a tool, if the caller's
 * scopes allow it: a client connected read-only doesn't see the write tools.
 * Results carry text for the model and `structuredContent` checked against
 * the operation's output schema.
 */
export function registerOperationTools(server: McpServer, caller: Caller) {
	for (const operation of allOperations) {
		if (!(operation.mcp && caller.scopes.includes(operation.scope))) {
			continue;
		}
		const { name, title, description, annotations } = operation.mcp;
		server.registerTool(
			name,
			{
				title,
				description,
				inputSchema: operation.input,
				outputSchema: operation.output,
				annotations,
			},
			async (args) => {
				try {
					const input = operation.input.parse(args);
					const result = operation.output.parse(
						await operation.run(
							{ db: getDb(), caller, requestId: newRequestId() },
							input,
						),
					);
					return {
						content: [{ type: "text", text: JSON.stringify(result) }],
						structuredContent: result,
					};
				} catch (error) {
					if (!(error instanceof ApiError)) {
						console.error(`MCP tool ${name} failed:`, error);
					}
					return {
						isError: true,
						content: [
							{
								type: "text",
								text:
									error instanceof ApiError
										? error.message
										: "Something went wrong. Try again later.",
							},
						],
					};
				}
			},
		);
	}
}

/** Where the protected resource metadata lives (RFC 9728 §3.1). */
export function resourceMetadataUrl(): string {
	const { origin, pathname } = new URL(mcpResource());
	return `${origin}/.well-known/oauth-protected-resource${pathname}`;
}

/** Browser-based clients (MCP Inspector) call the server cross-origin. It reads no cookies. */
const CORS: Record<string, string> = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
	"Access-Control-Allow-Headers":
		"Accept, Authorization, Content-Type, Last-Event-ID, Mcp-Protocol-Version, Mcp-Session-Id, X-Api-Key",
	"Access-Control-Expose-Headers":
		"Mcp-Protocol-Version, Mcp-Session-Id, WWW-Authenticate",
	"Access-Control-Max-Age": "86400",
};

function withCors(response: Response): Response {
	const headers = new Headers(response.headers);
	for (const [key, value] of Object.entries(CORS)) {
		headers.set(key, value);
	}
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

function jsonRpcError(status: number, message: string, headers = {}) {
	return Response.json(
		{ jsonrpc: "2.0", id: null, error: { code: -32001, message } },
		{ status, headers },
	);
}

/**
 * A 401 that starts the client's sign-in: the `WWW-Authenticate` challenge
 * (RFC 6750, RFC 9728) points at the protected resource metadata, which
 * points at better-auth's authorization server.
 */
function unauthorized(invalid: boolean): Response {
	const challenge = [
		`Bearer resource_metadata="${resourceMetadataUrl()}"`,
		`scope="${OAUTH_SCOPES.join(" ")}"`,
		...(invalid
			? ['error="invalid_token"', 'error_description="The token is not valid."']
			: []),
	].join(", ");
	return jsonRpcError(401, `Sign in to ${site.name} to use these tools.`, {
		"WWW-Authenticate": challenge,
	});
}

/**
 * The MCP server's route handler (Streamable HTTP). It accepts an OAuth
 * access token (MCP clients sign the user in through better-auth) or an API
 * key as the bearer token. Each request gets its own server, built for its
 * caller.
 */
export function createMcpRoute() {
	return async (request: Request): Promise<Response> => {
		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: CORS });
		}
		// A person who opens the URL in a browser gets the human explanation.
		if (
			request.method === "GET" &&
			request.headers.get("accept")?.includes("text/html")
		) {
			return Response.redirect(`${siteUrl()}/llms.txt`, 302);
		}
		if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
			return withCors(jsonRpcError(413, "Request body too large."));
		}

		const credential = credentialOf(request);
		if (!credential) {
			return withCors(unauthorized(false));
		}
		let caller: Caller | null = null;
		if (isApiKey(credential)) {
			try {
				caller = await callerFromApiKey(credential);
			} catch (error) {
				if (error instanceof ApiError && error.status === 429) {
					return withCors(
						jsonRpcError(429, error.message, { "Retry-After": "60" }),
					);
				}
			}
		} else {
			caller = await callerFromAccessToken(credential);
		}
		if (!caller) {
			return withCors(unauthorized(true));
		}

		const authorized = caller;
		const handler = createMcpHandler(
			(server) => registerOperationTools(server, authorized),
			{
				serverInfo: {
					name: site.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
					version: MCP_SERVER_VERSION,
				},
				instructions: INSTRUCTIONS,
			},
		);
		return withCors(await handler(request));
	};
}
