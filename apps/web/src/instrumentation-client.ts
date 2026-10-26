import { initAnalytics } from "@repo/analytics/client";

// Runs in the browser before the app hydrates. Without NEXT_PUBLIC_POSTHOG_KEY
// it does nothing.
initAnalytics({
	consentBanner: true, // turbinekit:consent
});
