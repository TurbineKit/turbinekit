import { defaultLocale, isLocale } from "@repo/i18n";
import { site } from "@repo/site";
import { type ComponentType, createElement } from "react";
import { render } from "react-email";
import { keys } from "./keys.ts";
import { type EmailStrings, fill, strings } from "./strings/index.ts";
import { OrganizationInvite } from "./templates/organization-invite.tsx"; // turbinekit:orgs
import { ResetPassword } from "./templates/reset-password.tsx";
import { TwoFactorCode } from "./templates/two-factor-code.tsx";
import { VerifyEmail } from "./templates/verify-email.tsx";
import { consoleTransport } from "./transports/console.ts";
import { emailSdkTransport } from "./transports/email-sdk.ts"; // turbinekit:email-sdk
import { resendTransport } from "./transports/resend.ts"; // turbinekit:resend
import type { Transport } from "./transports/types.ts";

export { strings } from "./strings/index.ts";
export { type MailboxEntry, readMailbox } from "./transports/console.ts";

/** Every email the app sends, with the props its template needs. */
export type TemplateProps = {
	"verify-email": { url: string };
	"reset-password": { url: string };
	"two-factor-code": { code: string };
	"organization-invite": { url: string; organization: string; inviter: string }; // turbinekit:orgs
};

export type EmailTemplate = keyof TemplateProps;

type Template<K extends EmailTemplate> = {
	subject: (t: EmailStrings, props: TemplateProps[K]) => string;
	component: ComponentType<TemplateProps[K] & { locale: string }>;
};

const TEMPLATES: { [K in EmailTemplate]: Template<K> } = {
	"verify-email": {
		subject: (t) => t.verifyEmail.subject,
		component: VerifyEmail,
	},
	"reset-password": {
		subject: (t) => t.resetPassword.subject,
		component: ResetPassword,
	},
	"two-factor-code": {
		subject: (t, props) => fill(t.twoFactorCode.subject, props),
		component: TwoFactorCode,
	},
	// #region turbinekit:orgs
	"organization-invite": {
		subject: (t, props) => fill(t.organizationInvite.subject, props),
		component: OrganizationInvite,
	},
	// #endregion turbinekit:orgs
};

/** The configured providers, in order. The first one with its keys set wins. */
const PROVIDERS: (() => Transport | null)[] = [
	resendTransport, // turbinekit:resend
	emailSdkTransport, // turbinekit:email-sdk
];

function transport(): Transport {
	if (keys().EMAIL_TRANSPORT === "console") {
		return consoleTransport;
	}
	for (const create of PROVIDERS) {
		const provider = create();
		if (provider) {
			return provider;
		}
	}
	if (process.env.NODE_ENV === "production") {
		throw new Error(
			"No email provider is configured. Set one up (SETUP.md, Email) or set EMAIL_TRANSPORT=console.",
		);
	}
	return consoleTransport;
}

/** Renders a template to HTML and plain text, in a locale. */
export async function renderEmail<K extends EmailTemplate>(
	template: K,
	props: TemplateProps[K],
	locale: string,
) {
	const { subject, component } = TEMPLATES[template] as Template<K>;
	// The template map is keyed by name, so TypeScript can't pair `component` with
	// `props` here; `sendEmail`'s signature already did.
	const element = createElement(
		component as unknown as ComponentType<Record<string, unknown>>,
		{ ...props, locale },
	);
	const [html, text] = await Promise.all([
		render(element),
		render(element, { plainText: true }),
	]);
	return { subject: subject(strings(locale), props), html, text };
}

/**
 * Sends one of the app's emails, in the recipient's language. Without a
 * provider it prints the email in development and throws in production.
 */
export async function sendEmail<K extends EmailTemplate>({
	to,
	template,
	props,
	locale,
	replyTo,
}: {
	to: string;
	template: K;
	props: TemplateProps[K];
	/** The recipient's language; unknown values fall back to the default. */
	locale?: string | null;
	replyTo?: string;
}): Promise<{ id: string | null }> {
	const language = isLocale(locale) ? locale : defaultLocale;
	const { subject, html, text } = await renderEmail(template, props, language);
	const sender = transport();
	const from =
		keys().EMAIL_FROM ??
		(sender === consoleTransport ? `${site.name} <noreply@localhost>` : null);
	if (!from) {
		throw new Error("EMAIL_FROM is not set (SETUP.md, Email).");
	}
	return sender.send({ from, to, subject, html, text, replyTo });
}
