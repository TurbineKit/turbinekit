import { PLANS, planOf } from "@repo/billing"; // turbinekit:payments
import { type AnyDb, schema } from "@repo/db";
import { siteUrl } from "@repo/site"; // turbinekit:payments
import { and, desc, eq, isNull, type SQL } from "drizzle-orm";
import {
	type Caller,
	ownerOf, // turbinekit:payments
} from "../context.ts";
import { ApiError } from "../errors.ts";
import { afterCursor, toPage } from "../pagination.ts";

const { project } = schema;

/** A project as the API returns it: dates as ISO strings. */
export type ProjectRecord = {
	id: string;
	name: string;
	description: string | null;
	organizationId: string | null; // turbinekit:orgs
	createdAt: string;
	updatedAt: string;
};

function toRecord(row: typeof project.$inferSelect): ProjectRecord {
	return {
		id: row.id,
		name: row.name,
		description: row.description,
		organizationId: row.organizationId, // turbinekit:orgs
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

/** The projects a caller may see: their team's, or their own personal ones. */
function visibleTo(caller: Caller): SQL | undefined {
	// #region turbinekit:orgs
	if (caller.organizationId) {
		return eq(project.organizationId, caller.organizationId);
	}
	// #endregion turbinekit:orgs
	return and(
		eq(project.ownerId, caller.userId),
		isNull(project.organizationId), // turbinekit:orgs
	);
}

export async function listProjects(
	db: AnyDb,
	caller: Caller,
	{ limit, cursor }: { limit: number; cursor?: string | undefined },
): Promise<{ data: ProjectRecord[]; nextCursor: string | null }> {
	const rows = await db
		.select()
		.from(project)
		.where(and(visibleTo(caller), afterCursor(project, cursor)))
		.orderBy(desc(project.createdAt), desc(project.id))
		.limit(limit + 1);
	return toPage(rows, limit, toRecord);
}

export async function countProjects(
	db: AnyDb,
	caller: Caller,
): Promise<number> {
	return db.$count(project, visibleTo(caller));
}

export async function getProject(
	db: AnyDb,
	caller: Caller,
	id: string,
): Promise<ProjectRecord> {
	const [row] = await db
		.select()
		.from(project)
		.where(and(eq(project.id, id), visibleTo(caller)))
		.limit(1);
	if (!row) {
		throw ApiError.notFound("project");
	}
	return toRecord(row);
}

// #region turbinekit:payments
/** The plan of whoever pays (the caller's team, or the caller) caps projects. */
async function assertRoomForProject(db: AnyDb, caller: Caller): Promise<void> {
	const limit = PLANS[await planOf(db, ownerOf(caller))].limits.projects;
	if ((await countProjects(db, caller)) >= limit) {
		throw new ApiError(
			403,
			"permission_error",
			"plan_limit_reached",
			`Your plan allows ${limit} projects. Upgrade at ${siteUrl()}/pricing.`,
		);
	}
}
// #endregion turbinekit:payments

export async function createProject(
	db: AnyDb,
	caller: Caller,
	input: { name: string; description?: string | null | undefined },
): Promise<ProjectRecord> {
	await assertRoomForProject(db, caller); // turbinekit:payments
	const [row] = await db
		.insert(project)
		.values({
			name: input.name,
			description: input.description ?? null,
			ownerId: caller.userId,
			organizationId: caller.organizationId, // turbinekit:orgs
		})
		.returning();
	if (!row) {
		throw new ApiError(
			500,
			"api_error",
			"insert_failed",
			"The project was not created.",
		);
	}
	return toRecord(row);
}

export async function updateProject(
	db: AnyDb,
	caller: Caller,
	id: string,
	changes: {
		name?: string | undefined;
		description?: string | null | undefined;
	},
): Promise<ProjectRecord> {
	const [row] = await db
		.update(project)
		.set({
			...(changes.name !== undefined && { name: changes.name }),
			...(changes.description !== undefined && {
				description: changes.description,
			}),
		})
		.where(and(eq(project.id, id), visibleTo(caller)))
		.returning();
	if (!row) {
		throw ApiError.notFound("project");
	}
	return toRecord(row);
}

export async function deleteProject(
	db: AnyDb,
	caller: Caller,
	id: string,
): Promise<{ id: string; deleted: true }> {
	const [row] = await db
		.delete(project)
		.where(and(eq(project.id, id), visibleTo(caller)))
		.returning({ id: project.id });
	if (!row) {
		throw ApiError.notFound("project");
	}
	return { id: row.id, deleted: true };
}
