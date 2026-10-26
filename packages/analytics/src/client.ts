import posthog from "posthog-js";
import { INGEST_PATH, POSTHOG_DEFAULTS, posthogHosts } from "./config.ts";
import type { EventMap, EventName } from "./events.ts";

export interface AnalyticsOptions {
	/**
	 * A consent banner asks first (the consent module). Until the visitor
	 * accepts, and after Reject, PostHog captures without cookies or storage
	 * and identifies no one. After Accept, it uses cookies and links events
	 * to the signed-in user. Without a banner, it always runs cookieless.
	 */
	consentBanner?: boolean;
}

export interface AnalyticsUser {
	id: string;
	email: string;
	createdAt: string;
}

/** The visitor's measurement choice, in PostHog's terms. */
export type ConsentChoice = "granted" | "denied" | "pending";

/** The signed-in user, kept until consent allows identifying them. */
let user: AnalyticsUser | null = null;

/**
 * Starts PostHog in the browser (instrumentation-client.ts). Does nothing
 * without NEXT_PUBLIC_POSTHOG_KEY. Cookieless capture needs "Cookieless
 * server hash mode" on in the PostHog project settings.
 */
export function initAnalytics(options: AnalyticsOptions = {}): void {
	const token = process.env.NEXT_PUBLIC_POSTHOG_KEY;
	if (!token || typeof window === "undefined" || posthog.__loaded) return;
	posthog.init(token, {
		api_host: INGEST_PATH,
		ui_host: posthogHosts(process.env.NEXT_PUBLIC_POSTHOG_HOST).ui,
		defaults: POSTHOG_DEFAULTS,
		// Anonymous visitors make no person profiles: less data, lower cost.
		person_profiles: "identified_only",
		capture_exceptions: true,
		cookieless_mode: options.consentBanner ? "on_reject" : "always",
		opt_out_capturing_by_default: options.consentBanner ?? false,
	});
}

/** Sends an event from the catalog (events.ts) when PostHog runs. */
export function track<E extends EventName>(
	event: E,
	properties: EventMap[E],
): void {
	if (!posthog.__loaded) return;
	// At once: an event often comes just before the page changes.
	posthog.capture(event, properties, { send_instantly: true });
}

/**
 * Links this browser's events to the signed-in user, once the visitor has
 * accepted measurement. Cookieless capture never identifies anyone.
 */
export function identifyUser(next: AnalyticsUser): void {
	user = next;
	identify();
}

/** Forgets the user (sign-out, account deletion). The consent choice stays. */
export function resetAnalytics(): void {
	user = null;
	if (!posthog.__loaded) return;
	const choice = posthog.get_explicit_consent_status();
	posthog.reset();
	// reset() also clears the stored consent flag.
	applyChoice(choice);
}

// #region turbinekit:consent
/**
 * Follows the visitor's choice in the consent banner (consent-manager.tsx).
 * Granted uses cookies and identifies the user. Denied and pending capture
 * without cookies.
 */
export function setMeasurementConsent(choice: ConsentChoice): void {
	if (!posthog.__loaded) return;
	if (posthog.get_explicit_consent_status() !== choice) applyChoice(choice);
	identify();
}
// #endregion turbinekit:consent

function applyChoice(choice: ConsentChoice): void {
	if (choice === "granted") posthog.opt_in_capturing();
	else if (choice === "denied") posthog.opt_out_capturing();
	else posthog.clear_opt_in_out_capturing();
}

function identify(): void {
	if (!user || !posthog.__loaded) return;
	if (posthog.get_explicit_consent_status() !== "granted") return;
	if (posthog.get_distinct_id() === user.id) return;
	posthog.identify(user.id, { email: user.email, created_at: user.createdAt });
}
