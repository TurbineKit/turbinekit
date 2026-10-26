import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@/content": fileURLToPath(new URL("./content", import.meta.url)),
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		include: ["src/**/*.test.{ts,tsx}"],
		environment: "node",
		// Tests never reach a real database or a paid service.
		env: { DATABASE_URL: "", SKIP_ENV_VALIDATION: "1" },
	},
});
