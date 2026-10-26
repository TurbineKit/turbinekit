import { PRICES } from "@repo/billing/plans";
import { buttonVariants } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { CheckIcon } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/json-ld";
import { Link } from "@/i18n/navigation";
import { priceLabel } from "@/lib/billing";
import { createMetadata, webPageSchema } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
	const locale = await getLocale();
	const t = await getTranslations("Pages.pricing");
	return createMetadata({
		title: t("title"),
		description: t("description"),
		path: "/pricing",
		locale,
	});
}

const FEATURES = ["projects", "api", "support"] as const;

/**
 * The plans of packages/billing plans.ts, at the prices `pnpm stripe:setup`
 * creates in Stripe. Static: buying happens in the account's billing tab.
 */
export default async function PricingPage() {
	const locale = await getLocale();
	const t = await getTranslations("Pricing");
	const page = await getTranslations("Pages.pricing");
	const format = await getFormatter();
	const money = (price: (typeof PRICES)[keyof typeof PRICES]) =>
		priceLabel(format, price);

	return (
		<main className="mx-auto max-w-5xl px-4 py-16">
			<JsonLd
				data={webPageSchema({
					path: "/pricing",
					locale,
					name: page("title"),
					description: page("description"),
				})}
			/>
			<div className="mx-auto mb-12 max-w-2xl text-center">
				<h1 className="text-4xl font-semibold tracking-tight">{t("title")}</h1>
				<p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
			</div>
			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-xl">{t("free.name")}</CardTitle>
						<CardDescription>{t("free.description")}</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-6">
						<p className="text-3xl font-semibold">{t("free.price")}</p>
						<Features plan="free" />
					</CardContent>
					<CardFooter className="mt-auto">
						<Link
							href="/sign-up"
							className={buttonVariants({
								variant: "outline",
								className: "w-full",
							})}
						>
							{t("free.cta")}
						</Link>
					</CardFooter>
				</Card>
				<Card className="border-foreground">
					<CardHeader>
						<CardTitle className="text-xl">{t("pro.name")}</CardTitle>
						<CardDescription>{t("pro.description")}</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-6">
						<div>
							<p className="text-3xl font-semibold">
								{t("monthly", { price: money(PRICES.pro_monthly) })}
							</p>
							<p className="text-sm text-muted-foreground">
								{t("yearly", { price: money(PRICES.pro_yearly) })}
							</p>
						</div>
						<Features plan="pro" />
					</CardContent>
					<CardFooter className="mt-auto">
						<Link
							href="/account/billing"
							className={buttonVariants({ className: "w-full" })}
						>
							{t("pro.cta")}
						</Link>
					</CardFooter>
				</Card>
			</div>
			<p className="mt-8 text-center text-sm text-muted-foreground">
				{t("cancel")}
			</p>
		</main>
	);
}

async function Features({ plan }: { plan: "free" | "pro" }) {
	const t = await getTranslations("Pricing");
	return (
		<ul className="flex flex-col gap-2 text-sm">
			{FEATURES.map((feature) => (
				<li key={feature} className="flex items-center gap-2">
					<CheckIcon className="size-4 text-muted-foreground" />
					{t(`${plan}.features.${feature}`)}
				</li>
			))}
		</ul>
	);
}
