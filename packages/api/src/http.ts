import { createId, getDb } from "@repo/db";
import { callerFromApiKey, credentialOf } from "./authenticate.ts";
import { ApiError } from "./errors.ts";
import type { Operation } from "./operation.ts";

/** Request bodies are small; anything larger is a mistake or an attack. */
const MAX_BODY_BYTES = 64 * 1024;

export function newRequestId(): string {
	return createId("req", 20);
}

/** JSON, never cached, with the request ID to quote to support. */
function json(
	requestId: string,
	body: unknown,
	status = 200,
	headers: Record<string, string> = {},
): Response {
	return Response.json(body, {
		status,
		headers: {
			"Cache-Control": "no-store",
			"Request-Id": requestId,
			...headers,
		},
	});
}

/** Every REST error has one shape: `{ error: { type, code, message, param? } }`. */
export function errorResponse(requestId: string, error: ApiError): Response {
	const headers: Record<string, string> =
		error.status === 429 ? { "Retry-After": "60" } : {};
	return json(requestId, { error: error.toJSON() }, error.status, headers);
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
	const text = await request.text();
	if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
		throw new ApiError(
			413,
			"invalid_request_error",
			"body_too_large",
			`The body must be at most ${MAX_BODY_BYTES} bytes.`,
		);
	}
	if (text.trim() === "") {
		return {};
	}
	try {
		const body: unknown = JSON.parse(text);
		if (typeof body !== "object" || body === null || Array.isArray(body)) {
			throw new Error("not an object");
		}
		return body as Record<string, unknown>;
	} catch {
		throw new ApiError(
			400,
			"invalid_request_error",
			"invalid_json",
			"The body must be a JSON object.",
		);
	}
}

type RouteContext = { params: Promise<Record<string, string | string[]>> };

/**
 * Serves an operation as a Next.js route handler under /api/v1:
 * authenticates the API key, checks its scope, validates path parameters,
 * query and body against the operation's input, runs it, and validates the
 * result against its output. Errors use one envelope; anything unexpected is
 * logged and answered with a 500 that carries the request ID.
 */
export function route(operation: Operation) {
	return async (request: Request, context: RouteContext): Promise<Response> => {
		const requestId = newRequestId();
		try {
			const credential = credentialOf(request);
			if (!credential) {
				throw new ApiError(
					401,
					"authentication_error",
					"missing_api_key",
					"Send an API key as `Authorization: Bearer <key>`. Create one in Account → API keys.",
				);
			}
			const caller = await callerFromApiKey(credential);
			if (!caller.scopes.includes(operation.scope)) {
				throw new ApiError(
					403,
					"permission_error",
					"insufficient_scope",
					`This API key can't do this: it needs the ${operation.scope} permission.`,
				);
			}

			const params = await context.params;
			const query = Object.fromEntries(new URL(request.url).searchParams);
			const body =
				operation.method === "POST" || operation.method === "PATCH"
					? await readBody(request)
					: {};
			// Path parameters win: a body can't redirect an update to another ID.
			const parsed = operation.input.safeParse({
				...query,
				...body,
				...params,
			});
			if (!parsed.success) {
				const issue = parsed.error.issues[0];
				throw new ApiError(
					400,
					"invalid_request_error",
					"invalid_parameter",
					issue
						? `${issue.path.join(".") || "body"}: ${issue.message}`
						: "Invalid request.",
					issue?.path.join(".") || undefined,
				);
			}

			const result = await operation.run(
				{ db: getDb(), caller, requestId },
				parsed.data,
			);
			return json(
				requestId,
				operation.output.parse(result),
				operation.status ?? 200,
			);
		} catch (error) {
			if (error instanceof ApiError) {
				return errorResponse(requestId, error);
			}
			console.error(
				`API ${request.method} ${new URL(request.url).pathname} failed (${requestId}):`,
				error,
			);
			return errorResponse(
				requestId,
				new ApiError(
					500,
					"api_error",
					"api_error",
					"Something went wrong on our side. Contact support with the request ID.",
				),
			);
		}
	};
}
