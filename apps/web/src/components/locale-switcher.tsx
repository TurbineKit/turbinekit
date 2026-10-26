"use client";

import { isLocale, localeNames, locales } from "@repo/i18n";
import { Button } from "@repo/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { LanguagesIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";

/**
 * Switches the page to another language. The choice is kept in the
 * NEXT_LOCALE cookie, so it wins over the browser's language next time.
 */
export function LocaleSwitcher() {
	const t = useTranslations("LocaleSwitcher");
	const locale = useLocale();
	const router = useRouter();
	const pathname = usePathname();
	const [pending, startTransition] = useTransition();

	if (locales.length < 2) {
		return null;
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						size="sm"
						aria-label={t("label")}
						disabled={pending}
					/>
				}
			>
				<LanguagesIcon />
				<span className="uppercase">{locale}</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-40">
				<DropdownMenuRadioGroup
					value={locale}
					onValueChange={(next) => {
						if (isLocale(next) && next !== locale) {
							startTransition(() => router.replace(pathname, { locale: next }));
						}
					}}
				>
					{locales.map((code) => (
						<DropdownMenuRadioItem key={code} value={code} lang={code}>
							{localeNames[code]}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
