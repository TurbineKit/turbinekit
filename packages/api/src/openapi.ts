import { site, siteUrl } from "@repo/site";
import { z } from "zod";
import type { HttpMethod } from "./operation.ts";
import { pathParams } from "./operation.ts";
import { allOperations } from "./operations/index.ts";

type JsonSchema = Record<string, unknown>;

function toSchema(
	schema: z.ZodType,
	io: "input" | "output" = "output",
): JsonSchema {
	const { $schema: _, ...rest } = z.toJSONSchema(schema, {
		io,
		unrepresentable: "any",
	}) as JsonSchema;
	return rest;
}

const errorSchema: JsonSchema = {
	type: "object",
	required: ["error"],
	properties: {
		error: {
			type: "object",
			required: ["type", "code", "message"],
			properties: {
				type: {
					type: "string",
					enum: [
						"invalid_request_error",
						"authentication_error",
						"permission_error",
						"not_found_error",
						"rate_limit_error",
						"api_error",
					],
				},
				code: { type: "string", description: "Stable; branch on it." },
				message: { type: "string", description: "For humans; it may change." },
				param: {
					type: "string",
					description: "The parameter at fault, if any.",
				},
			},
		},
	},
};

const errors = {
	"400": "The request is not valid.",
	"401": "The API key is missing or not valid.",
	"403": "The API key lacks the permission.",
	"404": "Nothing with this ID.",
	"429": "Too many requests: wait, then retry.",
};

/**
 * The OpenAPI 3.1 document of the REST API, built from the operations: no
 * list to keep in sync by hand. Served at /api/v1/openapi.json; the docs
 * site renders its reference from it.
 */
export function openApiDocument() {
	const paths: Record<
		string,
		Partial<Record<Lowercase<HttpMethod>, unknown>>
	> = {};
	for (const operation of allOperations) {
		const inPath = pathParams(operation.path);
		const input = toSchema(operation.input, "input") as {
			properties?: Record<string, JsonSchema>;
			required?: string[];
		};
		const properties = input.properties ?? {};
		const required = new Set(input.required ?? []);
		const hasBody = operation.method === "POST" || operation.method === "PATCH";

		const parameters = Object.entries(properties)
			.filter(([name]) => inPath.includes(name) || !hasBody)
			.map(([name, schema]) => ({
				name,
				in: inPath.includes(name) ? "path" : "query",
				required: inPath.includes(name) || required.has(name),
				...(typeof schema.description === "string" && {
					description: schema.description,
				}),
				schema,
			}));
		const bodyProperties = Object.fromEntries(
			Object.entries(properties).filter(([name]) => !inPath.includes(name)),
		);
		const bodyRequired = [...required].filter((name) => !inPath.includes(name));

		paths[operation.path] ??= {};
		paths[operation.path] = {
			...paths[operation.path],
			[operation.method.toLowerCase()]: {
				operationId: operation.id,
				summary: operation.summary,
				description: operation.description,
				tags: operation.tags,
				"x-required-permission": operation.scope,
				...(parameters.length > 0 && { parameters }),
				...(hasBody && {
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: bodyProperties,
									...(bodyRequired.length > 0 && { required: bodyRequired }),
								},
							},
						},
					},
				}),
				responses: {
					[String(operation.status ?? 200)]: {
						description: "Success.",
						content: {
							"application/json": { schema: toSchema(operation.output) },
						},
					},
					...Object.fromEntries(
						Object.entries(errors).map(([status, description]) => [
							status,
							{
								description,
								content: {
									"application/json": {
										schema: { $ref: "#/components/schemas/Error" },
									},
								},
							},
						]),
					),
				},
			},
		};
	}

	return {
		openapi: "3.1.0",
		info: {
			title: `${site.name} API`,
			version: "1.0.0",
			description: `The REST API of ${site.name}. Authenticate with an API key from Account → API keys, sent as \`Authorization: Bearer <key>\`. The same operations are available to AI assistants through the MCP server at ${siteUrl()}/mcp.`,
		},
		servers: [{ url: `${siteUrl()}/api` }],
		security: [{ apiKey: [] }],
		tags: [{ name: "Projects", description: "The example resource." }],
		paths,
		components: {
			securitySchemes: {
				apiKey: {
					type: "http",
					scheme: "bearer",
					description: `An API key. It starts with \`${site.apiKeyPrefix}\`.`,
				},
			},
			schemas: { Error: errorSchema },
		},
	};
}
