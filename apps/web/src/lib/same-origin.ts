import { siteUrl } from "@repo/site";

/**
 * Whether a cookie-authenticated request comes from this site's own pages.
 * Browsers send `Origin` on every POST; a cross-site form or fetch carries
 * another origin (or none), and is refused (CSRF).
 */
export function isSameOrigin(request: Request): boolean {
	const origin = request.headers.get("origin");
	if (!origin) {
		return false;
	}
	return (
		origin === new URL(siteUrl()).origin ||
		origin === new URL(request.url).origin
	);
}
