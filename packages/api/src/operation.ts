import type { Scope } from "@repo/auth";
import type { z } from "zod";
import type { OperationContext } from "./context.ts";

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

/**
 * One API operation, defined once. From this definition:
 * - http.ts serves it as REST under /api/v1,
 * - openapi.ts describes it in the OpenAPI document (and the docs site),
 * - mcp.ts offers it as an MCP tool when `mcp` is set.
 * The web app calls the same service function directly.
 */
export type Operation<
	Input extends z.ZodObject = z.ZodObject,
	Output extends z.ZodObject = z.ZodObject,
> = {
	/** `resource.action`, also the OpenAPI operationId. */
	id: string;
	method: HttpMethod;
	/** OpenAPI-style path under /api: `/v1/projects/{id}`. */
	path: string;
	summary: string;
	description: string;
	tags: string[];
	/** What the caller needs (an API key permission or an OAuth scope). */
	scope: Scope;
	/** Path parameters, query and body together, validated as one object. */
	input: Input;
	output: Output;
	/** HTTP status of a success. */
	status?: 200 | 201;
	/** Offered to MCP clients, with text written for a model. */
	mcp?: {
		name: string;
		title: string;
		description: string;
		annotations?: {
			readOnlyHint?: boolean;
			destructiveHint?: boolean;
			idempotentHint?: boolean;
		};
	};
	run: (
		context: OperationContext,
		input: z.output<Input>,
	) => Promise<z.input<Output>>;
};

export function defineOperation<
	Input extends z.ZodObject,
	Output extends z.ZodObject,
>(operation: Operation<Input, Output>): Operation<Input, Output> {
	return operation;
}

/** Path parameter names: `/v1/projects/{id}` → `["id"]`. */
export function pathParams(path: string): string[] {
	return [...path.matchAll(/\{(\w+)\}/g)].map((match) => match[1] as string);
}
