"use server";

import { ApiError } from "@repo/api";
import {
	createProject,
	deleteProject,
	type ProjectRecord,
	updateProject,
} from "@repo/api/services/projects";
import { getDb } from "@repo/db";
import { z } from "zod";
import { sessionCaller } from "@/lib/caller";
import { requireSession } from "@/lib/session";

// The same service functions the REST API and the MCP tools run, with the
// signed-in user as the caller. The schemas match the operations' inputs.
const name = z.string().trim().min(1).max(120);
const description = z.string().trim().max(2000).nullable();

/** A service's answer, or the message of the error it refused with. */
type Result<T> = { data: T; error?: never } | { data?: never; error: string };

/**
 * Expected refusals (a plan limit, a missing project, a bad input) come back
 * as a message: in production, React hides the message of a thrown error.
 */
async function attempt<T>(run: () => Promise<T>): Promise<Result<T>> {
	try {
		return { data: await run() };
	} catch (error) {
		if (error instanceof ApiError) {
			return { error: error.message };
		}
		if (error instanceof z.ZodError) {
			return { error: error.issues[0]?.message ?? "Invalid input." };
		}
		throw error;
	}
}

export async function createProjectAction(input: {
	name: string;
	description: string | null;
}): Promise<Result<ProjectRecord>> {
	const caller = sessionCaller(await requireSession());
	return attempt(() =>
		createProject(getDb(), caller, {
			name: name.parse(input.name),
			description: description.parse(input.description || null),
		}),
	);
}

export async function updateProjectAction(
	id: string,
	input: { name: string; description: string | null },
): Promise<Result<ProjectRecord>> {
	const caller = sessionCaller(await requireSession());
	return attempt(() =>
		updateProject(getDb(), caller, z.string().parse(id), {
			name: name.parse(input.name),
			description: description.parse(input.description || null),
		}),
	);
}

export async function deleteProjectAction(
	id: string,
): Promise<Result<{ id: string; deleted: true }>> {
	const caller = sessionCaller(await requireSession());
	return attempt(() => deleteProject(getDb(), caller, z.string().parse(id)));
}
