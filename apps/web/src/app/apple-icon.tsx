import { site } from "@repo/site";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The home-screen icon on iOS: the site's initial on the brand color. */
export default function AppleIcon() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "#0a0a0a",
				color: "#fafafa",
				fontSize: 110,
				fontWeight: 700,
			}}
		>
			{site.name.charAt(0)}
		</div>,
		size,
	);
}
