import { countProjects } from "@repo/api/services/projects";
import { getDb } from "@repo/db";
import { buttonVariants } from "@repo/ui/components/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { sessionCaller } from "@/lib/caller";
import { requireSession } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("App.dashboard");
	return { title: t("title") };
}

export default async function DashboardPage() {
	const t = await getTranslations("App.dashboard");
	return (
		<div className="flex flex-col gap-8">
			<Suspense fallback={<Skeleton className="h-9 w-64" />}>
				<Welcome />
			</Suspense>
			<p className="text-muted-foreground">{t("intro")}</p>
			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>{t("projects")}</CardTitle>
						<CardDescription>
							<Suspense fallback={<Skeleton className="h-4 w-24" />}>
								<ProjectCount />
							</Suspense>
						</CardDescription>
					</CardHeader>
					<CardFooter>
						<Link
							href="/projects"
							className={buttonVariants({ variant: "outline" })}
						>
							{t("openProjects")}
						</Link>
					</CardFooter>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>{t("apiTitle")}</CardTitle>
						<CardDescription>{t("apiBody")}</CardDescription>
					</CardHeader>
					<CardFooter className="gap-2">
						<Link
							href="/account/api-keys"
							className={buttonVariants({ variant: "outline" })}
						>
							{t("apiKeys")}
						</Link>
						<Link
							href="/account/connected-apps"
							className={buttonVariants({ variant: "ghost" })}
						>
							{t("connectedApps")}
						</Link>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}

async function Welcome() {
	const t = await getTranslations("App.dashboard");
	const { user } = await requireSession();
	return (
		<h1 className="text-3xl font-semibold tracking-tight">
			{t("welcome", { name: user.name.split(" ")[0] ?? user.name })}
		</h1>
	);
}

async function ProjectCount() {
	const t = await getTranslations("App.dashboard");
	const caller = sessionCaller(await requireSession());
	const count = await countProjects(getDb(), caller);
	return t("projectsCount", { count });
}
