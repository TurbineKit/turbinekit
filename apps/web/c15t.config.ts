import { policyRulePresets } from "c15t";
import { defineConsentConfig, offline } from "c15t/next";

/**
 * The consent banner's rules (components/consent-manager.tsx). This file is
 * bundled into the browser too: no secrets here.
 *
 * offline() runs without a consent backend. The browser picks the rule for
 * the visitor's country and region (from the host's location headers, such
 * as Vercel's), and keeps the choice. To keep a record of each choice on
 * the server, run a c15t backend (see LAUNCH.md).
 */
export default defineConsentConfig({
	mode: offline({
		policyRules: [
			// The EEA and the UK. Also the rule when the country is unknown.
			policyRulePresets.europeOptIn(),
			policyRulePresets.quebecOptIn(),
			policyRulePresets.usPrivacyStatesOptOut(),
			// No banner elsewhere, but "Cookie settings" in the footer still opens
			// the dialog.
			policyRulePresets.worldOptOutNoPrompt(),
		],
	}),
	// #region turbinekit:analytics
	// Named so the dialog says who receives measurement data. PostHog follows
	// the category switch; it loads from instrumentation-client.ts.
	vendors: [
		{
			id: "posthog",
			name: "PostHog",
			legalName: "PostHog, Inc.",
			category: "measurement",
			homepageUrl: "https://posthog.com",
			privacyPolicyUrl: "https://posthog.com/privacy",
			disabled: true,
		},
	],
	// #endregion turbinekit:analytics
	options: {
		consentCategories: ["necessary", "measurement"],
		// No iframe here carries data-category, so the blocker would only watch
		// the whole page for nothing.
		iframeBlocker: false,
	},
});
