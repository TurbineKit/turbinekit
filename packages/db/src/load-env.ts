import { existsSync } from "node:fs";

/**
 * Loads the web app's env files for scripts that run outside Next.js
 * (migrations, drizzle-kit, the auth CLI). Variables already set win.
 */
for (const file of ["../../../apps/web/.env.local", "../../../apps/web/.env"]) {
	const path = new URL(file, import.meta.url);
	if (existsSync(path)) {
		process.loadEnvFile(path);
	}
}
