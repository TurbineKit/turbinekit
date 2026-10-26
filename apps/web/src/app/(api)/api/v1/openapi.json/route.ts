import { openApiDocument } from "@repo/api/openapi";

/**
 * The OpenAPI 3.1 document of the REST API, built from the operations in
 * packages/api. Public and prerendered; the docs site renders it.
 */
export function GET() {
	return Response.json(openApiDocument(), {
		headers: { "Access-Control-Allow-Origin": "*" },
	});
}
