import { after } from "next/server";
import { PostHog } from "posthog-node";
import { posthogHosts } from "./config.ts";
import type { EventMap, EventName } from "./events.ts";

let client: PostHog | null | undefined;

/** posthog-node, or null without NEXT_PUBLIC_POSTHOG_KEY. */
function getPostHog(): PostHog | null {
	if (client === undefined) {
		const token = process.env.NEXT_PUBLIC_POSTHOG_KEY;
		client = token
			? new PostHog(token, {
					host: posthogHosts(process.env.NEXT_PUBLIC_POSTHOG_HOST).ingest,
					// A function can freeze once its response is sent, so no timer
					// flushes: each capture flushes after the response (flushSoon).
					flushAt: 20,
					flushInterval: 0,
					// Checking a flag sends no event.
					sendFeatureFlagEvent: false,
				})
			: null;
	}
	return client;
}

function flush(target: PostHog): Promise<void> {
	return target.flush().catch((error: unknown) => {
		console.error("[analytics] flush failed", error);
	});
}

/** After the response; outside a request (scripts, tests), at once. */
function flushSoon(target: PostHog): void {
	try {
		after(() => flush(target));
	} catch {
		void flush(target);
	}
}

/**
 * Sends an event for a user from the server, for what only the server sees
 * (a webhook, a job). PostHog stores it against that user: where the law
 * asks for consent, send it only for users who gave it.
 */
export function track<E extends EventName>(
	distinctId: string,
	event: E,
	properties: EventMap[E],
): void {
	const target = getPostHog();
	if (!target) return;
	target.capture({ distinctId, event, properties });
	flushSoon(target);
}

/**
 * Reports a server error to PostHog error tracking, with no person attached.
 * It waits for the send, for onRequestError (instrumentation.ts).
 */
export async function captureException(
	error: unknown,
	properties?: Record<string, unknown>,
): Promise<void> {
	const target = getPostHog();
	if (!target) return;
	target.captureException(error, undefined, properties);
	await flush(target);
}

/**
 * Whether a feature flag is on. It never throws: a flag PostHog can't answer
 * (no key, no network, no such flag) is off, so what it hides stays hidden.
 * Without a distinct id, every visitor gets the same answer.
 */
export async function isFeatureEnabled(
	key: string,
	distinctId = "anonymous",
): Promise<boolean> {
	const target = getPostHog();
	if (!target) return false;
	try {
		const flags = await target.evaluateFlags(distinctId, { flagKeys: [key] });
		return flags.isEnabled(key);
	} catch (error) {
		console.error(`[analytics] flag ${key} failed`, error);
		return false;
	}
}
