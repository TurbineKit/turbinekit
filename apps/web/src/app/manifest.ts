import { defaultLocale } from "@repo/i18n";
import { site } from "@repo/site";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: site.name,
		short_name: site.name,
		description: site.description,
		lang: defaultLocale,
		start_url: "/",
		scope: "/",
		display: "standalone",
		background_color: "#ffffff",
		theme_color: "#0a0a0a",
		icons: [
			{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
			{ src: "/apple-icon", sizes: "180x180", type: "image/png" },
		],
	};
}
