import { z } from "zod";
import { defineOperation } from "../operation.ts";
import * as projects from "../services/projects.ts";

const Project = z.object({
	id: z.string().describe("The project's ID. It starts with `prj_`."),
	name: z.string(),
	description: z.string().nullable(),
	// #region turbinekit:orgs
	organizationId: z
		.string()
		.nullable()
		.describe("The team that owns it, or null for a personal project."),
	// #endregion turbinekit:orgs
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

const ProjectId = z.string().min(1).describe("The project's ID.");

export const listProjects = defineOperation({
	id: "projects.list",
	method: "GET",
	path: "/v1/projects",
	summary: "List projects",
	description: "Returns the caller's projects, newest first, a page at a time.",
	tags: ["Projects"],
	scope: "projects:read",
	input: z.object({
		limit: z.coerce.number().int().min(1).max(100).default(20),
		cursor: z
			.string()
			.optional()
			.describe("The `nextCursor` of the previous page."),
	}),
	output: z.object({
		data: z.array(Project),
		nextCursor: z
			.string()
			.nullable()
			.describe("Pass it as `cursor` for the next page; null on the last."),
	}),
	mcp: {
		name: "list_projects",
		title: "List projects",
		description:
			"Lists the user's projects, newest first, 20 at a time. When nextCursor is not null, call again with it as cursor to see more.",
		annotations: { readOnlyHint: true },
	},
	run: ({ db, caller }, input) => projects.listProjects(db, caller, input),
});

export const getProject = defineOperation({
	id: "projects.get",
	method: "GET",
	path: "/v1/projects/{id}",
	summary: "Get a project",
	description: "Returns one project by its ID.",
	tags: ["Projects"],
	scope: "projects:read",
	input: z.object({ id: ProjectId }),
	output: Project,
	mcp: {
		name: "get_project",
		title: "Get a project",
		description: "Returns one of the user's projects by its ID (prj_…).",
		annotations: { readOnlyHint: true },
	},
	run: ({ db, caller }, { id }) => projects.getProject(db, caller, id),
});

export const createProject = defineOperation({
	id: "projects.create",
	method: "POST",
	path: "/v1/projects",
	summary: "Create a project",
	description: "Creates a project and returns it.",
	tags: ["Projects"],
	scope: "projects:write",
	status: 201,
	input: z.object({
		name: z.string().trim().min(1).max(120),
		description: z.string().trim().max(2000).nullable().optional(),
	}),
	output: Project,
	mcp: {
		name: "create_project",
		title: "Create a project",
		description:
			"Creates a project for the user with a name (and an optional description), and returns it.",
	},
	run: ({ db, caller }, input) => projects.createProject(db, caller, input),
});

export const updateProject = defineOperation({
	id: "projects.update",
	method: "PATCH",
	path: "/v1/projects/{id}",
	summary: "Update a project",
	description:
		"Changes a project's name or description. Omitted fields stay as they are.",
	tags: ["Projects"],
	scope: "projects:write",
	input: z.object({
		id: ProjectId,
		name: z.string().trim().min(1).max(120).optional(),
		description: z.string().trim().max(2000).nullable().optional(),
	}),
	output: Project,
	mcp: {
		name: "update_project",
		title: "Update a project",
		description:
			"Renames a project or changes its description. Only the fields given change.",
		annotations: { idempotentHint: true },
	},
	run: ({ db, caller }, { id, ...changes }) =>
		projects.updateProject(db, caller, id, changes),
});

export const deleteProject = defineOperation({
	id: "projects.delete",
	method: "DELETE",
	path: "/v1/projects/{id}",
	summary: "Delete a project",
	description: "Deletes a project for good.",
	tags: ["Projects"],
	scope: "projects:write",
	input: z.object({ id: ProjectId }),
	output: z.object({ id: z.string(), deleted: z.literal(true) }),
	mcp: {
		name: "delete_project",
		title: "Delete a project",
		description:
			"Deletes one of the user's projects for good. Ask the user to confirm first.",
		annotations: { destructiveHint: true },
	},
	run: ({ db, caller }, { id }) => projects.deleteProject(db, caller, id),
});
