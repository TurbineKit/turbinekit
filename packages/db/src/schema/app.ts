import {
	index,
	jsonb, // turbinekit:admin
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { createId } from "../id.ts";
import {
	organization, // turbinekit:orgs
	user,
} from "./auth.ts";

/**
 * The example resource: it shows one table travelling through every layer
 * (service, server actions, REST, MCP, docs, tests). Rename it or replace it
 * with your own; the add-table and add-operation skills show how. App tables
 * use timestamptz, so times never depend on the database's time zone.
 */
export const project = pgTable(
	"project",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId("prj")),
		name: text("name").notNull(),
		description: text("description"),
		ownerId: text("owner_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		// #region turbinekit:orgs
		/** Set when the project belongs to a team instead of one person. */
		organizationId: text("organization_id").references(() => organization.id, {
			onDelete: "cascade",
		}),
		// #endregion turbinekit:orgs
		createdAt: timestamp("created_at", { withTimezone: true, precision: 3 })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("project_owner_idx").on(table.ownerId),
		index("project_organization_idx").on(table.organizationId), // turbinekit:orgs
	],
);

// #region turbinekit:admin
/**
 * What admins did: bans, role changes and impersonation, with who did it.
 * Written by the admin actions (apps/web …/admin/actions.ts), never updated.
 */
export const auditLog = pgTable(
	"audit_log",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId("aud")),
		actorId: text("actor_id").references(() => user.id, {
			onDelete: "set null",
		}),
		/** A dotted verb: `user.banned`, `user.impersonated`… */
		action: text("action").notNull(),
		targetId: text("target_id"),
		details: jsonb("details").$type<Record<string, unknown>>(),
		createdAt: timestamp("created_at", { withTimezone: true, precision: 3 })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("audit_log_created_idx").on(table.createdAt),
		index("audit_log_target_idx").on(table.targetId),
	],
);
// #endregion turbinekit:admin
