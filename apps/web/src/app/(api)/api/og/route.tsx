import { site } from "@repo/site";
import { ImageResponse } from "next/og";
import { clampText, OG_DESCRIPTION_MAX, OG_SIZE, OG_TITLE_MAX } from "@/lib/og";

/**
 * The share card for a page: `/api/og?title=…&description=…`, as
 * `ogImagePath` builds it. The text is cut to a safe length, so no request
 * can ask for a huge render. robots.ts keeps this path open to crawlers.
 */
export function GET(request: Request) {
	const params = new URL(request.url).searchParams;
	const title = clampText(params.get("title") || site.name, OG_TITLE_MAX);
	const description = clampText(
		params.get("description") ?? "",
		OG_DESCRIPTION_MAX,
	);

	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				padding: 72,
				background: "#0a0a0a",
				color: "#fafafa",
			}}
		>
			<div style={{ display: "flex", fontSize: 32, opacity: 0.7 }}>
				{site.name}
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
				<div
					style={{
						display: "flex",
						fontSize: title.length > 60 ? 56 : 72,
						fontWeight: 700,
						lineHeight: 1.1,
						letterSpacing: -2,
					}}
				>
					{title}
				</div>
				{description && (
					<div
						style={{
							display: "flex",
							fontSize: 30,
							lineHeight: 1.4,
							opacity: 0.7,
						}}
					>
						{description}
					</div>
				)}
			</div>
		</div>,
		{
			...OG_SIZE,
			headers: {
				"Cache-Control":
					"public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
			},
		},
	);
}
