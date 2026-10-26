import { apiKey } from "@better-auth/api-key";
import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { mcp } from "@better-auth/mcp";
import { passkey } from "@better-auth/passkey";
import { type AnyDb, getDb, schema } from "@repo/db";
import { createId, ID_PREFIXES } from "@repo/db/id";
import { sendEmail } from "@repo/email";
import { defaultLocale, isLocale, type Locale } from "@repo/i18n";
import { site, siteUrl } from "@repo/site";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import {
	admin, // turbinekit:admin
	jwt,
	organization, // turbinekit:orgs
	twoFactor,
} from "better-auth/plugins";
import { after } from "next/server";
import { API_KEY_CONFIG } from "./api-keys.ts";
import { revokeConnectedApps } from "./connected-apps.ts";
import { keys } from "./keys.ts";
import { mcpResource, OAUTH_SCOPES, oauthIssuer } from "./oauth.ts";

/** The language a user picked at sign-up, for their emails. */
function localeOf(user: object): Locale {
	const locale = (user as { locale?: string | null }).locale;
	return isLocale(locale) ? locale : defaultLocale;
}

// #region turbinekit:orgs
/** A path on this site in a locale: `/x` (default locale) or `/fr/x`. */
function localizedUrl(path: string, locale: Locale): string {
	const prefix = locale === defaultLocale ? "" : `/${locale}`;
	return `${siteUrl()}${prefix}${path}`;
}
// #endregion turbinekit:orgs

/** The deployment's own origins, plus any listed in BETTER_AUTH_TRUSTED_ORIGINS. */
function trustedOrigins(extra: string | undefined): string[] {
	const vercel = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
		.filter(Boolean)
		.map((host) => `https://${host}`);
	const listed = (extra ?? "")
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);
	return [new URL(siteUrl()).origin, ...vercel, ...listed];
}

/** Options for running outside Next.js (tests, scripts). */
type CreateAuthOptions = {
	/** False outside a Next.js request: no `after()`, no cookie writes. */
	nextjs?: boolean;
};

/**
 * The auth server. Built from a database handle so tests pass PGlite; the
 * app uses `getAuth()`, which builds it on first use.
 */
export function createAuth(
	db: AnyDb,
	{ nextjs = true }: CreateAuthOptions = {},
) {
	const env = keys();
	const baseURL = siteUrl();
	const origin = new URL(baseURL).origin;
	const google =
		env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
			? {
					clientId: env.GOOGLE_CLIENT_ID,
					clientSecret: env.GOOGLE_CLIENT_SECRET,
				}
			: undefined;
	const github =
		env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
			? {
					clientId: env.GITHUB_CLIENT_ID,
					clientSecret: env.GITHUB_CLIENT_SECRET,
				}
			: undefined;

	return betterAuth({
		appName: site.name,
		baseURL,
		secret: env.BETTER_AUTH_SECRET,
		database: drizzleAdapter(db, { provider: "pg", schema }),
		trustedOrigins: trustedOrigins(env.BETTER_AUTH_TRUSTED_ORIGINS),
		// In-memory counters reset on every serverless cold start: keep them in Postgres.
		rateLimit: { enabled: true, storage: "database" },
		// No cookie cache: each request checks the session in the database, so
		// a ban, a revoked session or a password reset applies at once.
		session: {
			expiresIn: 60 * 60 * 24 * 7,
			updateAge: 60 * 60 * 24,
		},
		advanced: {
			database: {
				generateId: ({ model }) =>
					createId(ID_PREFIXES[model] ?? model.slice(0, 3).toLowerCase()),
			},
			// Emails go out after the response: its timing doesn't reveal whether
			// an account exists, and serverless doesn't cut the send short.
			backgroundTasks: {
				handler: (task) => (nextjs ? after(task) : void task),
			},
		},
		// The jwt plugin's GET /token would hand a browser a JWT nobody uses. API
		// keys are created by a server action only (account settings).
		disabledPaths: [
			"/token",
			"/api-key/create",
			"/api-key/update",
			"/api-key/delete",
		],
		user: {
			additionalFields: {
				/** The language of the site at sign-up: emails use it. */
				locale: {
					type: "string",
					required: false,
					defaultValue: defaultLocale,
				},
			},
			deleteUser: { enabled: true },
		},
		account: {
			accountLinking: { enabled: true, trustedProviders: ["google", "github"] },
		},
		emailVerification: {
			sendOnSignUp: true,
			// Signing in unverified sends a fresh link instead of a session.
			sendOnSignIn: true,
			autoSignInAfterVerification: true,
			sendVerificationEmail: async ({ user, url }) => {
				await sendEmail({
					to: user.email,
					template: "verify-email",
					props: { url },
					locale: localeOf(user),
				});
			},
		},
		emailAndPassword: {
			enabled: true,
			// No session until the address is proven.
			requireEmailVerification: true,
			revokeSessionsOnPasswordReset: true,
			sendResetPassword: async ({ user, url }) => {
				await sendEmail({
					to: user.email,
					template: "reset-password",
					props: { url },
					locale: localeOf(user),
				});
			},
			// A stolen password must not keep a quiet way in through a connected app.
			onPasswordReset: async ({ user }) => {
				await revokeConnectedApps(db, user.id);
			},
		},
		socialProviders: {
			...(google && { google }),
			...(github && { github }),
		},
		plugins: [
			twoFactor({
				issuer: site.name,
				otpOptions: {
					storeOTP: "hashed",
					sendOTP: async ({ user, otp }) => {
						await sendEmail({
							to: user.email,
							template: "two-factor-code",
							props: { code: otp },
							locale: localeOf(user),
						});
					},
				},
			}),
			passkey({ rpID: new URL(baseURL).hostname, rpName: site.name, origin }),
			apiKey([API_KEY_CONFIG]),
			// Admins are users with the `admin` role: `pnpm admin:grant <email>`.
			admin({ impersonationSessionDuration: 60 * 60 }), // turbinekit:admin
			// #region turbinekit:orgs
			organization({
				requireEmailVerificationOnInvitation: true,
				sendInvitationEmail: async ({ id, email, organization, inviter }) => {
					const locale = localeOf(inviter.user);
					await sendEmail({
						to: email,
						template: "organization-invite",
						props: {
							url: localizedUrl(`/org/invitations/${id}`, locale),
							organization: organization.name,
							inviter: inviter.user.name || inviter.user.email,
						},
						locale,
					});
				},
			}),
			// #endregion turbinekit:orgs
			// OAuth for MCP clients. The jwt plugin signs the access tokens; it
			// sets no JWT header on sessions.
			jwt({ jwt: { issuer: oauthIssuer() }, disableSettingJwtHeader: true }),
			mcp({
				resource: mcpResource(),
				scopes: OAUTH_SCOPES,
				loginPage: "/sign-in",
				consentPage: "/oauth/consent",
				// MCP Inspector, Claude Code, Cursor and others register themselves.
				allowDynamicClientRegistration: true,
				allowUnauthenticatedClientRegistration: true,
				// Native clients that omit application_type (Cursor, Claude Code)
				// register with an http loopback callback; web clients stay https-only.
				clientRegistrationDefaultApplicationType: "infer",
				// Many users refresh from one client's few addresses.
				rateLimit: { token: { window: 60, max: 600 } },
			}),
			// Client ID Metadata Documents (MCP 2026-07-28): a client names itself
			// with an HTTPS URL that describes it.
			cimd({ fetchClientMetadataResource, metadataProfile: "mcp-2026-07-28" }),
			// Must stay last, so cookies set by other plugins reach server actions.
			...(nextjs ? [nextCookies()] : []),
		],
	});
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth["$Infer"]["Session"];

let instance: Auth | undefined;

/**
 * The app's auth server, built on first use (never during the build). Kept
 * per module, so a hot reload picks up config changes. Tests inject their own
 * through `globalThis.__repoAuth`.
 */
export function getAuth(): Auth {
	const injected = (globalThis as { __repoAuth?: Auth }).__repoAuth;
	if (injected) {
		return injected;
	}
	instance ??= createAuth(getDb());
	return instance;
}
