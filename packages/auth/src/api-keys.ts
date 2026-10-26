import type { ApiKeyConfigurationOptions } from "@better-auth/api-key";
import { site } from "@repo/site";

/** What a key looks like, checked before the database is asked. */
export const API_KEY_PATTERN = new RegExp(`^${site.apiKeyPrefix}[A-Za-z]{48}$`);

/** Per key: the plugin counts from the window's first request. */
export const API_RATE_LIMIT = { timeWindow: 60_000, maxRequests: 120 };

/**
 * API keys for the REST API and the MCP server. Created only by a server
 * action (account settings), never over HTTP (see `disabledPaths`), and never
 * usable as a session on the auth endpoints.
 */
export const API_KEY_CONFIG = {
	configId: "default",
	defaultPrefix: site.apiKeyPrefix,
	defaultKeyLength: 48,
	references: "user",
	requireName: true,
	maximumNameLength: 64,
	// #region turbinekit:orgs
	// metadata.organizationId: the team a key acts for (teamOfKey).
	enableMetadata: true,
	// #endregion turbinekit:orgs
	enableSessionForAPIKeys: false,
	startingCharactersConfig: { shouldStore: true, charactersLength: 10 },
	keyExpiration: { defaultExpiresIn: null },
	rateLimit: { enabled: true, ...API_RATE_LIMIT },
	permissions: { defaultPermissions: { projects: ["read"] } },
} satisfies ApiKeyConfigurationOptions;
