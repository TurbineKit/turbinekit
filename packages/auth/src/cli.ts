import "@repo/db/load-env";
import { createDb } from "@repo/db";
import { createAuth } from "./server.ts";

/**
 * For `pnpm auth:generate` only: the better-auth CLI reads this
 * configuration to write packages/db/src/schema/auth.ts. No query runs, so
 * the database URL is never used.
 */
process.env.BETTER_AUTH_SECRET ||= "schema-generation-only-0123456789abcdef";

export const auth = createAuth(createDb("postgres://localhost:5432/unused"));
