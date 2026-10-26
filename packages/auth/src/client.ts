import { apiKeyClient } from "@better-auth/api-key/client";
import { oauthProviderClient } from "@better-auth/oauth-provider/client";
import { passkeyClient } from "@better-auth/passkey/client";
import {
	adminClient, // turbinekit:admin
	inferAdditionalFields,
	organizationClient, // turbinekit:orgs
	twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { Auth } from "./server.ts";

/**
 * The browser's auth client. `onTwoFactorRedirect` runs when a sign-in needs
 * the second factor; the app sends the user to its localized /two-factor.
 */
export function createClient(
	options: { onTwoFactorRedirect?: () => void } = {},
) {
	return createAuthClient({
		plugins: [
			// The server's extra user fields, such as `locale` on sign-up.
			inferAdditionalFields<Auth>(),
			twoFactorClient({ onTwoFactorRedirect: options.onTwoFactorRedirect }),
			passkeyClient(),
			apiKeyClient(),
			adminClient(), // turbinekit:admin
			organizationClient(), // turbinekit:orgs
			// On the pages an OAuth flow passes through (sign-in, two-factor,
			// consent), sends the signed query along, so signing in continues
			// the MCP client's authorization.
			oauthProviderClient(),
		],
	});
}

export type AuthClient = ReturnType<typeof createClient>;
