/** Structured data for search engines (schema.org JSON-LD). */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
	return (
		<script
			type="application/ld+json"
			// Escaping `<` keeps the payload from closing the script tag.
			// biome-ignore lint/security/noDangerouslySetInnerHtml: serialized JSON, `<` escaped.
			dangerouslySetInnerHTML={{
				__html: JSON.stringify(data).replace(/</g, "\\u003c"),
			}}
		/>
	);
}
