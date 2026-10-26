"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/** Light, dark or the system's choice, kept in localStorage. */
export function ThemeProvider(
	props: ComponentProps<typeof NextThemesProvider>,
) {
	return (
		<NextThemesProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
			{...props}
		/>
	);
}
