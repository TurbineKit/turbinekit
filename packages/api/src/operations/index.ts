import type { Operation } from "../operation.ts";
import * as projects from "./projects.ts";

/**
 * Every operation of the API. REST routes, the OpenAPI document and the MCP
 * tools are all built from this list: add an operation here (the
 * add-operation skill shows the whole path).
 */
export const operations = {
	listProjects: projects.listProjects,
	getProject: projects.getProject,
	createProject: projects.createProject,
	updateProject: projects.updateProject,
	deleteProject: projects.deleteProject,
};

export const allOperations = Object.values(operations) as Operation[];
