import { listProjects } from "@repo/api/services/projects";
import { getDb } from "@repo/db";
import { Skeleton } from "@repo/ui/components/skeleton";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Projects } from "@/components/app/projects";
import { sessionCaller } from "@/lib/caller";
import { requireSession } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("Projects");
	return { title: t("title") };
}

export default async function ProjectsPage() {
	const t = await getTranslations("Projects");
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
				<p className="text-muted-foreground">{t("description")}</p>
			</div>
			<Suspense fallback={<Skeleton className="h-40" />}>
				<ProjectList />
			</Suspense>
			<p className="font-mono text-xs text-muted-foreground">{t("apiHint")}</p>
		</div>
	);
}

async function ProjectList() {
	const caller = sessionCaller(await requireSession());
	const { data } = await listProjects(getDb(), caller, { limit: 100 });
	return <Projects projects={data} />;
}
