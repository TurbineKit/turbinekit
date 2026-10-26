import { defineConfig } from "vitest/config";

export default defineConfig({
	// Not template/: the bundled copy has the template's own tests.
	test: { include: ["src/**/*.test.ts"] },
});
