import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { isLegalSlug, legalSlugs, loadLegalPage } from "@/lib/legal";
import { createMetadata } from "@/lib/metadata";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
	return legalSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	if (!isLegalSlug(slug)) {
		return {};
	}
	const locale = await getLocale();
	const t = await getTranslations("Legal");
	const { translated } = await loadLegalPage(slug, locale);
	return createMetadata({
		title: t(`${slug}.title`),
		description: t(`${slug}.description`),
		path: `/legal/${slug}`,
		locale,
		translated,
	});
}

/**
 * Every link to a legal page shares one prefetched shell, so the slug is
 * read inside <Suspense>. A direct visit still gets the full page: each
 * slug is prerendered (generateStaticParams).
 */
export default function LegalPage({ params }: Props) {
	return (
		<main className="mx-auto max-w-3xl px-4 py-16">
			<Suspense>
				<LegalContent params={params} />
			</Suspense>
		</main>
	);
}

async function LegalContent({ params }: Props) {
	const { slug } = await params;
	if (!isLegalSlug(slug)) {
		notFound();
	}
	const locale = await getLocale();
	const t = await getTranslations("Legal");
	const format = await getFormatter();
	const { Content, updated, translated } = await loadLegalPage(slug, locale);

	return (
		<>
			{!translated && (
				<p className="mb-8 rounded-lg border bg-muted px-4 py-3 text-sm text-muted-foreground">
					{t("notTranslated")}
				</p>
			)}
			<article className="prose prose-neutral dark:prose-invert max-w-none">
				<Content />
			</article>
			<p className="mt-12 text-sm text-muted-foreground">
				{t("updated", {
					date: format.dateTime(new Date(updated), { dateStyle: "long" }),
				})}
			</p>
		</>
	);
}
