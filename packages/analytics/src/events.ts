type NoProps = Record<string, never>;

/**
 * Every event the app sends by name, with its properties. `track()` (client
 * and server) only takes these. Names are snake_case, in the past tense.
 * Properties never carry content people typed (names, descriptions, email
 * addresses): counts, choices and ids only.
 */
export interface EventMap {
	signed_up: { method: "email" };
	project_created: NoProps;
	api_key_created: { access: "read" | "readWrite" };
}

export type EventName = keyof EventMap;
