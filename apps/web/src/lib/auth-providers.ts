import { keys } from "@repo/auth/keys";

export type SocialProvider = "google" | "github";

/**
 * The social sign-in providers with their keys set. It reads the
 * environment, so call it at request time (after `connection()`).
 */
export function socialProviders(): SocialProvider[] {
	const env = keys();
	const providers: SocialProvider[] = [];
	if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
		providers.push("google");
	}
	if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
		providers.push("github");
	}
	return providers;
}
