import type { Locale } from "@repo/i18n";
import type en from "../messages/en.json";

// Message keys are checked at compile time: `t("typo")` fails the typecheck.
// English is the reference catalog; every other one must have the same keys
// (src/lib/messages.test.ts).
declare module "next-intl" {
	interface AppConfig {
		Locale: Locale;
		Messages: typeof en;
	}
}
