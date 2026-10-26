import type { AbstractIntlMessages } from "next-intl";

/**
 * Message sections that only server components read (`getTranslations`).
 * Every page sends its client messages to the browser, so these stay out of
 * that payload. messages.test.ts fails if a `useTranslations` call reads one.
 */
export const SERVER_ONLY_NAMESPACES = [
	"Home",
	"Pages",
	"Legal",
	"NotFound",
	"Pricing", // turbinekit:payments
];

export function clientMessages(
	messages: AbstractIntlMessages,
): AbstractIntlMessages {
	return Object.fromEntries(
		Object.entries(messages).filter(
			([key]) => !SERVER_ONLY_NAMESPACES.includes(key),
		),
	);
}
