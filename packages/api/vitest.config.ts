import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		env: {
			BETTER_AUTH_SECRET: "test-secret-0123456789abcdefghijklmnop",
			SITE_URL: "http://localhost:3000",
			NODE_ENV: "test",
		},
		testTimeout: 30_000,
	},
});
