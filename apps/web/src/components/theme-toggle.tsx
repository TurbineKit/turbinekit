"use client";

import { Button } from "@repo/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

export function ThemeToggle() {
	const t = useTranslations("Theme");
	const { theme = "system", setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={<Button variant="ghost" size="icon" aria-label={t("label")} />}
			>
				<SunIcon className="dark:hidden" />
				<MoonIcon className="hidden dark:block" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-36">
				<DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
					<DropdownMenuRadioItem value="light">
						{t("light")}
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="dark">
						{t("dark")}
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="system">
						{t("system")}
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
