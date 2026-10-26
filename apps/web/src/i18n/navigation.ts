import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

const navigation = createNavigation(routing);

/**
 * Locale-aware stand-ins for `next/link` and `next/navigation`. Write hrefs
 * without a prefix (`/dashboard`); these add the visitor's (`/fr/dashboard`).
 * Biome blocks `next/link` everywhere else.
 */
export const { Link, usePathname, useRouter, getPathname } = navigation;

/** Typed as `never`, so `if (!session) redirect(…)` narrows `session`. */
export const redirect: (
	args: Parameters<typeof navigation.redirect>[0],
) => never = navigation.redirect;
