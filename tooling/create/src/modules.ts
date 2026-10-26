/**
 * What each module owns beyond its markers: whole files and folders, and the
 * entries of JSON files (which can't hold markers). When a module is off,
 * the generator removes all of it. `pnpm build` writes this as modules.json
 * into the package, for the add-module skill.
 */

export type ModuleId =
	| "files"
	| "docs"
	| "analytics"
	| "consent"
	| "orgs"
	| "admin"
	| "payments";

export type Manifest = {
	/** Files and folders, from the project root. */
	files?: string[];
	/** Dependencies, by package.json path. */
	dependencies?: Record<string, string[]>;
	/** Scripts, by package.json path. */
	scripts?: Record<string, string[]>;
	/** Variables of `tasks.build.env` in turbo.json. */
	turboEnv?: string[];
	/** Dotted keys in every apps/web/messages/<locale>.json. */
	messages?: string[];
};

export type Module = Manifest & {
	id: ModuleId;
	label: string;
	hint: string;
	/** Other modules this one needs. */
	requires?: ModuleId[];
};

const WEB = "apps/web/package.json";

export const MODULES: Module[] = [
	{
		id: "orgs",
		label: "Teams",
		hint: "organizations, invitations, a team switcher, team projects and keys",
		files: [
			"apps/web/src/app/[locale]/(app)/org",
			"apps/web/src/components/org",
			"apps/web/src/components/app/org-switcher.tsx",
			"packages/auth/src/teams.ts",
			"packages/email/src/templates/organization-invite.tsx",
			"apps/web/e2e/teams.spec.ts",
		],
		messages: [
			"Org",
			"App.nav.organization",
			"Account.apiKeys.team",
			"Account.apiKeys.forTeam",
		],
	},
	{
		id: "admin",
		label: "Admin console",
		hint: "users, roles, bans, impersonation, an audit log",
		files: [
			"apps/web/src/app/[locale]/(app)/admin",
			"apps/web/src/components/admin",
			"packages/auth/src/bans.ts",
			"packages/auth/src/grant-admin.ts",
			"apps/web/e2e/admin.spec.ts",
		],
		scripts: {
			"package.json": ["admin:grant"],
			"packages/auth/package.json": ["grant-admin"],
		},
		messages: ["Admin", "App.nav.admin"],
	},
	{
		id: "payments",
		label: "Payments",
		hint: "Stripe Checkout and portal, plans and limits, a pricing page",
		files: [
			"packages/billing",
			"packages/db/src/schema/billing.ts",
			"apps/web/src/app/[locale]/(core)/pricing",
			"apps/web/src/app/[locale]/(app)/account/billing",
			"apps/web/src/app/(api)/api/webhooks",
			"apps/web/src/components/account/billing-actions.tsx",
			"apps/web/src/lib/billing.ts",
			"apps/web/e2e/billing.spec.ts",
		],
		dependencies: {
			[WEB]: ["@repo/billing"],
			"packages/api/package.json": ["@repo/billing"],
		},
		scripts: { "package.json": ["stripe:setup"] },
		messages: [
			"Pricing",
			"Pages.pricing",
			"Nav.pricing",
			"Account.billing",
			"Account.tabs.billing",
		],
	},
	{
		id: "files",
		label: "File uploads",
		hint: "Files SDK: local disk, S3-compatible stores or Vercel Blob",
		files: [
			"packages/storage",
			"apps/web/src/app/(api)/api/files",
			"apps/web/src/app/(api)/api/uploads",
			"apps/web/src/components/account/avatar-upload.tsx",
		],
		dependencies: { [WEB]: ["@repo/storage", "sharp"] },
		messages: [
			"Account.profile.avatar",
			"Account.profile.avatarUpload",
			"Account.profile.avatarHelp",
		],
	},
	{
		id: "docs",
		label: "API docs",
		hint: "Blume: guides and the API reference at /docs",
		files: ["apps/docs"],
		turboEnv: ["DOCS_ORIGIN"],
		messages: ["Nav.docs", "App.nav.docs", "Home.secondary"],
	},
	{
		id: "analytics",
		label: "Analytics",
		hint: "PostHog: typed events, errors, flags, cookieless by default",
		files: [
			"packages/analytics",
			"apps/web/src/instrumentation.ts",
			"apps/web/src/instrumentation-client.ts",
			"apps/web/src/app/(api)/ingest",
			"apps/web/src/components/analytics-identify.tsx",
		],
		dependencies: { [WEB]: ["@repo/analytics", "@posthog/nextjs-config"] },
		turboEnv: ["POSTHOG_API_KEY", "POSTHOG_PROJECT_ID"],
	},
	{
		id: "consent",
		label: "Consent banner",
		hint: "c15t: opt-in in the EU, the UK and Quebec",
		files: [
			"apps/web/c15t.config.ts",
			"apps/web/src/components/consent-manager.tsx",
			"apps/web/e2e/consent.spec.ts",
		],
		dependencies: { [WEB]: ["c15t", "@c15t/translations"] },
		messages: ["Footer.cookieSettings"],
	},
];

export const MODULE_IDS = MODULES.map((module) => module.id);

/** Files that exist only while two modules are both on. */
export const PAIRS: { modules: [ModuleId, ModuleId]; files: string[] }[] = [
	{
		modules: ["analytics", "consent"],
		files: [
			"apps/web/src/components/consent-analytics.tsx",
			"apps/web/e2e/analytics-consent.spec.ts",
		],
	},
];

export type EmailProvider = "resend" | "email-sdk";
export type FilesDriver = "local" | "s3" | "vercel-blob";

/** Each choice's code, removed when another one is picked. */
export const EMAIL_PROVIDERS: Record<
	EmailProvider,
	Manifest & { label: string; hint: string }
> = {
	resend: {
		label: "Resend",
		hint: "one provider, the simplest",
		files: ["packages/email/src/transports/resend.ts"],
		dependencies: { "packages/email/package.json": ["resend"] },
	},
	"email-sdk": {
		label: "Email SDK",
		hint: "Resend, Postmark or SMTP, with fallback",
		files: ["packages/email/src/transports/email-sdk.ts"],
		dependencies: { "packages/email/package.json": ["@opencoredev/email-sdk"] },
	},
};

export const FILES_DRIVERS: Record<
	FilesDriver,
	Manifest & { label: string; hint: string }
> = {
	local: { label: "Local disk", hint: "development, or a server with a disk" },
	s3: {
		label: "S3-compatible",
		hint: "Cloudflare R2, AWS S3, MinIO",
		dependencies: {
			"packages/storage/package.json": [
				"@aws-sdk/client-s3",
				"@aws-sdk/lib-storage",
				"@aws-sdk/s3-presigned-post",
				"@aws-sdk/s3-request-presigner",
			],
		},
	},
	"vercel-blob": {
		label: "Vercel Blob",
		hint: "on Vercel",
		dependencies: { "packages/storage/package.json": ["@vercel/blob"] },
	},
};

/** Entries of JSON files that only the TurbineKit repository uses. */
export const TEMPLATE_MANIFEST: Manifest = {
	dependencies: {
		"package.json": ["@changesets/cli", "@changesets/changelog-github"],
	},
	scripts: { "package.json": ["changeset"] },
};

/** Only in the TurbineKit repository: never in a project. */
export const TEMPLATE_ONLY: string[] = [
	"tooling",
	".changeset",
	"CONTRIBUTING.md",
	".github/workflows/cli.yml",
	".github/workflows/release.yml",
];

/** Never copied from the repository into a project. */
export const IGNORED = new Set([
	".git",
	"node_modules",
	".next",
	".turbo",
	".pglite",
	".storage",
	".vercel",
	"dist",
	".blume",
	".blume-verify",
	".env.local",
	"skills-lock.json",
	"tsconfig.tsbuildinfo",
	"next-env.d.ts",
	".DS_Store",
]);
