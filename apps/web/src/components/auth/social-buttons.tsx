"use client";

import { Button } from "@repo/ui/components/button";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { GitHubIcon, GoogleIcon } from "@/components/auth/provider-icons";
import { getPathname } from "@/i18n/navigation";
import { signIn } from "@/lib/auth-client";
import type { SocialProvider } from "@/lib/auth-providers";
import { safeNext } from "@/lib/oauth-query";

const PROVIDERS: Record<
	SocialProvider,
	{ name: string; icon: () => React.JSX.Element }
> = {
	google: { name: "Google", icon: GoogleIcon },
	github: { name: "GitHub", icon: GitHubIcon },
};

/** Google and GitHub sign-in, shown only for the providers with keys set. */
export function SocialButtons({ providers }: { providers: SocialProvider[] }) {
	const t = useTranslations("Auth");
	const locale = useLocale();
	const [pending, setPending] = useState<SocialProvider | null>(null);

	if (providers.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-col gap-2">
			{providers.map((provider) => {
				const { name, icon: Icon } = PROVIDERS[provider];
				return (
					<Button
						key={provider}
						type="button"
						variant="outline"
						size="lg"
						disabled={pending !== null}
						onClick={async () => {
							setPending(provider);
							const next = new URLSearchParams(window.location.search).get(
								"next",
							);
							await signIn.social({
								provider,
								callbackURL:
									safeNext(next) ?? getPathname({ href: "/dashboard", locale }),
							});
						}}
					>
						<Icon />
						{t("continueWith", { provider: name })}
					</Button>
				);
			})}
			<div className="my-2 flex items-center gap-3 text-xs text-muted-foreground uppercase">
				<span className="h-px flex-1 bg-border" />
				{t("or")}
				<span className="h-px flex-1 bg-border" />
			</div>
		</div>
	);
}
