import { getAuth } from "@repo/auth";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { headers } from "next/headers";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { UserActions } from "@/components/admin/user-actions";
import { getPathname, Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/session";

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

const PAGE_SIZE = 50;

export default function AdminUsersPage({ searchParams }: Props) {
	return (
		<Suspense fallback={<Skeleton className="h-96" />}>
			<Users searchParams={searchParams} />
		</Suspense>
	);
}

async function Users({ searchParams }: Props) {
	const { user: admin } = await requireAdmin();
	const { q = "", page = "1" } = await searchParams;
	const query = q.trim();
	const current = Math.max(1, Number.parseInt(page, 10) || 1);
	const t = await getTranslations("Admin.users");
	const format = await getFormatter();
	const locale = await getLocale();
	const { users, total } = await getAuth().api.listUsers({
		query: {
			limit: PAGE_SIZE,
			offset: (current - 1) * PAGE_SIZE,
			sortBy: "createdAt",
			sortDirection: "desc",
			...(query && {
				searchField: "email",
				searchOperator: "contains",
				searchValue: query,
			}),
		},
		headers: await headers(),
	});
	const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const pageHref = (n: number) => ({
		pathname: "/admin",
		query: { ...(query && { q: query }), page: String(n) },
	});

	return (
		<div className="flex flex-col gap-4">
			<form
				action={getPathname({ href: "/admin", locale })}
				className="flex max-w-md gap-2"
			>
				<Input
					name="q"
					type="search"
					defaultValue={query}
					placeholder={t("search")}
					aria-label={t("search")}
				/>
				<Button type="submit" variant="outline">
					{t("searchButton")}
				</Button>
			</form>
			<p className="text-sm text-muted-foreground">
				{t("count", { count: total })}
			</p>
			{users.length === 0 ? (
				<p className="text-sm text-muted-foreground">{t("empty")}</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("user")}</TableHead>
							<TableHead>{t("created")}</TableHead>
							<TableHead>{t("status")}</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{users.map((user) => (
							<TableRow key={user.id}>
								<TableCell>
									<p className="font-medium">{user.name}</p>
									<p className="text-xs text-muted-foreground">{user.email}</p>
								</TableCell>
								<TableCell>
									{format.dateTime(new Date(user.createdAt), {
										dateStyle: "medium",
									})}
								</TableCell>
								<TableCell>
									<div className="flex flex-wrap gap-1">
										{user.role === "admin" && <Badge>{t("admin")}</Badge>}
										{user.banned ? (
											<Badge variant="destructive">{t("banned")}</Badge>
										) : (
											<Badge variant="secondary">{t("active")}</Badge>
										)}
										{!user.emailVerified && (
											<Badge variant="outline">{t("unverified")}</Badge>
										)}
									</div>
								</TableCell>
								<TableCell className="text-right">
									{user.id !== admin.id && (
										<UserActions
											user={{
												id: user.id,
												name: user.name || user.email,
												admin: user.role === "admin",
												banned: Boolean(user.banned),
											}}
										/>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
			{pages > 1 && (
				<div className="flex gap-2">
					{current > 1 && (
						<Button
							variant="outline"
							size="sm"
							nativeButton={false}
							render={<Link href={pageHref(current - 1)} />}
						>
							{t("previous")}
						</Button>
					)}
					{current < pages && (
						<Button
							variant="outline"
							size="sm"
							nativeButton={false}
							render={<Link href={pageHref(current + 1)} />}
						>
							{t("next")}
						</Button>
					)}
				</div>
			)}
		</div>
	);
}
