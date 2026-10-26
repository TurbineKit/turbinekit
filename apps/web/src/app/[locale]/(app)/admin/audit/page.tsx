import { getDb, schema } from "@repo/db";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getFormatter, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/session";

export default function AuditPage() {
	return (
		<Suspense fallback={<Skeleton className="h-96" />}>
			<AuditLog />
		</Suspense>
	);
}

/** Audit actions and the message that names each one. */
const ACTIONS = {
	"user.banned": "banned",
	"user.unbanned": "unbanned",
	"user.role": "roleChanged",
	"user.impersonated": "impersonated",
} as const;

async function AuditLog() {
	await requireAdmin();
	const t = await getTranslations("Admin.audit");
	const format = await getFormatter();
	const { auditLog, user } = schema;
	const actor = alias(user, "actor");
	const target = alias(user, "target");
	const rows = await getDb()
		.select({
			id: auditLog.id,
			action: auditLog.action,
			details: auditLog.details,
			createdAt: auditLog.createdAt,
			actor: actor.email,
			target: target.email,
		})
		.from(auditLog)
		.leftJoin(actor, eq(actor.id, auditLog.actorId))
		.leftJoin(target, eq(target.id, auditLog.targetId))
		.orderBy(desc(auditLog.createdAt))
		.limit(200);

	if (rows.length === 0) {
		return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>{t("when")}</TableHead>
					<TableHead>{t("who")}</TableHead>
					<TableHead>{t("what")}</TableHead>
					<TableHead>{t("target")}</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{rows.map((row) => {
					const key = ACTIONS[row.action as keyof typeof ACTIONS];
					return (
						<TableRow key={row.id}>
							<TableCell className="whitespace-nowrap">
								{format.dateTime(row.createdAt, {
									dateStyle: "medium",
									timeStyle: "short",
								})}
							</TableCell>
							<TableCell>{row.actor ?? t("deleted")}</TableCell>
							<TableCell>
								{key
									? t(`actions.${key}`, {
											role: String(row.details?.role ?? ""),
										})
									: row.action}
							</TableCell>
							<TableCell>{row.target ?? t("deleted")}</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}
