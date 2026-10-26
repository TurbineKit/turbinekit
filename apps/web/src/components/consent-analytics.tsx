"use client";

import { setMeasurementConsent } from "@repo/analytics/client";
import { useConsent, useExplicitChoice, usePolicyResolution } from "c15t/next";
import { useEffect } from "react";

/**
 * Passes the visitor's measurement choice to PostHog. c15t's callbacks fire
 * on a change only, not for the state a page loads with, so this reads the
 * permission itself.
 *
 * Granted turns on cookies. Only a real Reject is "denied"; a visitor who has
 * not chosen, or whose choice expired, is "pending". Both capture without
 * cookies (cookieless_mode "on_reject" in @repo/analytics/client).
 */
export function ConsentAnalytics() {
	const resolved = usePolicyResolution().status === "matched";
	const measurement = useConsent("measurement");
	const rejected = useExplicitChoice()?.categories.measurement?.value === false;

	useEffect(() => {
		// Until a rule matches, every optional category reads as denied. Acting
		// on that would opt out a visitor who accepted, on every page load.
		if (!resolved) return;
		setMeasurementConsent(
			measurement ? "granted" : rejected ? "denied" : "pending",
		);
	}, [resolved, measurement, rejected]);

	return null;
}
