import { site } from "@repo/site";
import { Badge } from "@repo/ui/components/badge";
import { buttonVariants } from "@repo/ui/components/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import {
	BotIcon,
	LanguagesIcon,
	type LucideIcon,
	PlugIcon,
	SearchIcon,
	ShieldCheckIcon,
	UnlockIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/json-ld";
import { Link } from "@/i18n/navigation";
import { createMetadata, webPageSchema } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
	const locale = await getLocale();
	const t = await getTranslations("Pages.home");
	return createMetadata({
		title: t("title", { name: site.name }),
		description: t("description"),
		path: "/",
		locale,
		absoluteTitle: true,
	});
}

const FEATURES: { key: string; icon: LucideIcon }[] = [
	{ key: "i18n", icon: LanguagesIcon },
	{ key: "seo", icon: SearchIcon },
	{ key: "auth", icon: ShieldCheckIcon },
	{ key: "api", icon: PlugIcon },
	{ key: "agents", icon: BotIcon },
	{ key: "open", icon: UnlockIcon },
];

export default async function HomePage() {
	const locale = await getLocale();
	const t = await getTranslations("Home");
	const page = await getTranslations("Pages.home");

	return (
		<main>
			<JsonLd
				data={webPageSchema({
					path: "/",
					locale,
					name: site.name,
					description: page("description"),
				})}
			/>
			<section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pt-24 pb-20 text-center">
				<Badge variant="secondary">{t("badge")}</Badge>
				<h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
					{site.name}
				</h1>
				<p className="max-w-xl text-lg text-balance text-muted-foreground">
					{page("description")}
				</p>
				<div className="flex flex-wrap justify-center gap-3">
					<Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
						{t("primary")}
					</Link>
					{/* #region turbinekit:docs */}
					<a
						href="/docs"
						className={buttonVariants({ size: "lg", variant: "outline" })}
					>
						{t("secondary")}
					</a>
					{/* #endregion turbinekit:docs */}
				</div>
			</section>
			<section className="mx-auto max-w-6xl px-4 pb-24">
				<div className="mb-10 flex flex-col gap-2 text-center">
					<h2 className="text-2xl font-semibold tracking-tight text-balance">
						{t("featuresTitle")}
					</h2>
					<p className="text-muted-foreground">{t("featuresIntro")}</p>
				</div>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{FEATURES.map(({ key, icon: Icon }) => (
						<Card key={key}>
							<CardHeader>
								<Icon
									className="mb-2 size-5 text-muted-foreground"
									aria-hidden
								/>
								<CardTitle>
									{t(`features.${key}.title` as "features.i18n.title")}
								</CardTitle>
								<CardDescription>
									{t(`features.${key}.body` as "features.i18n.body")}
								</CardDescription>
							</CardHeader>
						</Card>
					))}
				</div>
			</section>
		</main>
	);
}
