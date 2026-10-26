export const OG_SIZE = { width: 1200, height: 630 } as const;

/** Longest title and description a card draws. Longer text is cut. */
export const OG_TITLE_MAX = 100;
export const OG_DESCRIPTION_MAX = 200;

/** Site-relative URL of the share card for a page: `/api/og?title=…`. */
export function ogImagePath(title: string, description?: string): string {
	const params = new URLSearchParams({ title });
	if (description) {
		params.set("description", description);
	}
	return `/api/og?${params}`;
}

/** Cuts a string to `max` characters (code points, not UTF-16 units). */
export function clampText(value: string, max: number): string {
	const characters = Array.from(value.trim());
	return characters.length > max
		? `${characters.slice(0, max - 1).join("")}…`
		: characters.join("");
}
