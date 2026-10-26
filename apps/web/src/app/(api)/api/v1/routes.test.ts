import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { operations } from "@repo/api";
import { describe, expect, it } from "vitest";

const apiDir = join(import.meta.dirname, "..");

/** `/v1/projects/{id}` → `<apiDir>/v1/projects/[id]/route.ts`. */
function routeFile(path: string): string {
	return join(apiDir, `${path.replace(/\{(\w+)\}/g, "[$1]")}/route.ts`);
}

describe("REST routes", () => {
	it("serve every operation at its path and method", async () => {
		for (const [key, operation] of Object.entries(operations)) {
			const source = await readFile(routeFile(operation.path), "utf8").catch(
				() => "",
			);
			expect(source, `${operation.id}: ${routeFile(operation.path)}`).toContain(
				`export const ${operation.method} = route(operations.${key});`,
			);
		}
	});

	it("serve nothing that isn't an operation", async () => {
		const files = (
			await readdir(join(apiDir, "v1"), { recursive: true })
		).filter(
			(file) => file.endsWith("route.ts") && !file.startsWith("openapi.json"),
		);
		for (const file of files) {
			const source = await readFile(join(apiDir, "v1", file), "utf8");
			for (const [, method, key] of source.matchAll(
				/export const (\w+) = route\(operations\.(\w+)\)/g,
			)) {
				const operation = operations[key as keyof typeof operations];
				expect(operation, `${file}: operations.${key}`).toBeDefined();
				expect(operation?.method).toBe(method);
			}
		}
	});
});
