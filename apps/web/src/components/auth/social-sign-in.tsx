import { connection } from "next/server";
import { SocialButtons } from "@/components/auth/social-buttons";
import { socialProviders } from "@/lib/auth-providers";

/**
 * The social buttons for the providers configured at request time. Render it
 * inside <Suspense>: it reads the environment when the page is served, so a
 * key added later shows without a rebuild.
 */
export async function SocialSignIn() {
	await connection();
	return <SocialButtons providers={socialProviders()} />;
}
