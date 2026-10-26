import {
	ALL_SCOPES,
	type Auth,
	createAuth,
	permissionsFromScopes,
	type Scope,
} from "@repo/auth";
import { schema } from "@repo/db"; // turbinekit:orgs|admin|payments
import { createTestDb, insertUser, type TestDb } from "@repo/db/testing";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { route } from "./http.ts";
import { createMcpRoute } from "./mcp.ts";
import { openApiDocument } from "./openapi.ts";
import { operations } from "./operations/index.ts";

const BASE = "http://localhost:3000/api";

let db: TestDb;
let close: () => Promise<void>;
let auth: Auth;
let writeKey: string;
let readKey: string;
let otherKey: string;

async function keyFor(userId: string, scopes: readonly Scope[]) {
	const created = await auth.api.createApiKey({
		body: { name: "test", userId, permissions: permissionsFromScopes(scopes) },
	});
	return created.key;
}

/**
 * A JSON response, read field by field in the assertions. Add the fields of
 * a new resource here.
 */
type Body = {
	id: string;
	name: string;
	description: string | null;
	deleted: boolean;
	data: Array<{ id: string }>;
	nextCursor: string | null;
	error: { type: string; code: string; message: string; param?: string };
};

/** Calls an operation's route handler like Next.js would. */
async function call(
	operation: (typeof operations)[keyof typeof operations],
	{
		key,
		params = {},
		query = "",
		body,
	}: {
		key?: string;
		params?: Record<string, string>;
		query?: string;
		body?: unknown;
	},
) {
	const path = operation.path.replace(
		/\{(\w+)\}/g,
		(_, name: string) => params[name] ?? "",
	);
	const response = await route(operation)(
		new Request(`${BASE}${path}${query}`, {
			method: operation.method,
			headers: {
				...(key && { Authorization: `Bearer ${key}` }),
				"Content-Type": "application/json",
			},
			body: body === undefined ? undefined : JSON.stringify(body),
		}),
		{ params: Promise.resolve(params) },
	);
	return { status: response.status, body: (await response.json()) as Body };
}

beforeAll(async () => {
	({ db, close } = await createTestDb());
	auth = createAuth(db, { nextjs: false });
	// getAuth() and getDb() read these caches: the routes use the test instances.
	Object.assign(globalThis, { __repoAuth: auth, __repoDb: db });
	const owner = await insertUser(db);
	const other = await insertUser(db);
	// #region turbinekit:payments
	// The owner pays for Pro: the free plan's project limit would stop the tests.
	await db.insert(schema.billingSubscription).values({
		id: "sub_test_owner",
		referenceId: owner.id,
		plan: "pro",
		status: "active",
		priceId: "price_test",
	});
	// #endregion turbinekit:payments
	// Every permission, so a new resource's tests can use the same keys.
	writeKey = await keyFor(owner.id, ALL_SCOPES);
	readKey = await keyFor(
		owner.id,
		ALL_SCOPES.filter((scope) => scope.endsWith(":read")),
	);
	otherKey = await keyFor(other.id, ALL_SCOPES);
});

afterAll(async () => {
	await close();
});

describe("REST", () => {
	it("creates, reads, updates and deletes a project", async () => {
		const created = await call(operations.createProject, {
			key: writeKey,
			body: { name: "Apollo", description: "To the moon" },
		});
		expect(created.status).toBe(201);
		expect(created.body.id).toMatch(/^prj_/);

		const listed = await call(operations.listProjects, { key: readKey });
		expect(listed.body.data.map((p: { id: string }) => p.id)).toContain(
			created.body.id,
		);

		const updated = await call(operations.updateProject, {
			key: writeKey,
			params: { id: created.body.id },
			body: { name: "Artemis" },
		});
		expect(updated.body.name).toBe("Artemis");
		expect(updated.body.description).toBe("To the moon");

		const deleted = await call(operations.deleteProject, {
			key: writeKey,
			params: { id: created.body.id },
		});
		expect(deleted.body).toEqual({ id: created.body.id, deleted: true });

		const gone = await call(operations.getProject, {
			key: readKey,
			params: { id: created.body.id },
		});
		expect(gone.status).toBe(404);
		expect(gone.body.error.code).toBe("resource_missing");
	});

	it("pages through projects with a cursor", async () => {
		for (const name of ["One", "Two", "Three"]) {
			await call(operations.createProject, { key: writeKey, body: { name } });
		}
		const first = await call(operations.listProjects, {
			key: readKey,
			query: "?limit=2",
		});
		expect(first.body.data).toHaveLength(2);
		expect(first.body.nextCursor).toBeTruthy();
		const second = await call(operations.listProjects, {
			key: readKey,
			query: `?limit=2&cursor=${first.body.nextCursor}`,
		});
		expect(second.body.data.length).toBeGreaterThan(0);
		const ids = [...first.body.data, ...second.body.data].map(
			(p: { id: string }) => p.id,
		);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("pages through rows created in the same millisecond", async () => {
		const user = await insertUser(db);
		const ids = ["prj_samemsAAAAAAAAAAA", "prj_samemsBBBBBBBBBBB"];
		// A few microseconds apart: the column keeps milliseconds, so the
		// cursor's JavaScript date matches the stored time exactly.
		const times = [
			"2026-01-01T10:00:00.123456Z",
			"2026-01-01T10:00:00.123200Z",
		];
		for (const [index, id] of ids.entries()) {
			await db.execute(
				sql`insert into project (id, name, owner_id, created_at, updated_at)
					values (${id}, ${id}, ${user.id}, ${times[index]}::timestamptz, now())`,
			);
		}
		const key = await keyFor(user.id, ["projects:read"]);
		const first = await call(operations.listProjects, {
			key,
			query: "?limit=1",
		});
		const second = await call(operations.listProjects, {
			key,
			query: `?limit=1&cursor=${first.body.nextCursor}`,
		});
		expect(
			[...first.body.data, ...second.body.data].map((p) => p.id).sort(),
		).toEqual(ids);
		expect(second.body.nextCursor).toBeNull();
	});

	it("keeps each user's projects to themselves", async () => {
		const mine = await call(operations.createProject, {
			key: writeKey,
			body: { name: "Private" },
		});
		const theirs = await call(operations.getProject, {
			key: otherKey,
			params: { id: mine.body.id },
		});
		expect(theirs.status).toBe(404);
	});

	it("answers errors with one envelope", async () => {
		const missing = await call(operations.listProjects, {});
		expect(missing.status).toBe(401);
		expect(missing.body.error).toMatchObject({
			type: "authentication_error",
			code: "missing_api_key",
		});

		const readOnly = await call(operations.createProject, {
			key: readKey,
			body: { name: "Nope" },
		});
		expect(readOnly.status).toBe(403);
		expect(readOnly.body.error.code).toBe("insufficient_scope");

		const invalid = await call(operations.createProject, {
			key: writeKey,
			body: { name: "" },
		});
		expect(invalid.status).toBe(400);
		expect(invalid.body.error.param).toBe("name");

		const badKey = await call(operations.listProjects, {
			key: "tk_not-a-real-key",
		});
		expect(badKey.status).toBe(401);
	});
});

// #region turbinekit:orgs
describe("Teams", () => {
	it("scopes a team key to the team while its owner belongs to it", async () => {
		const owner = await insertUser(db);
		const team = await auth.api.createOrganization({
			body: { name: "Acme", slug: `acme-${owner.id}`, userId: owner.id },
		});
		const teamKey = (
			await auth.api.createApiKey({
				body: {
					name: "team",
					userId: owner.id,
					permissions: permissionsFromScopes([
						"projects:read",
						"projects:write",
					]),
					metadata: { organizationId: team?.id },
				},
			})
		).key;
		const personalKey = await keyFor(owner.id, ["projects:read"]);

		const created = await call(operations.createProject, {
			key: teamKey,
			body: { name: "Team project" },
		});
		expect(created.status).toBe(201);
		const personal = await call(operations.listProjects, { key: personalKey });
		expect(personal.body.data.map((p) => p.id)).not.toContain(created.body.id);

		await db.delete(schema.member).where(eq(schema.member.userId, owner.id));
		const removed = await call(operations.listProjects, { key: teamKey });
		expect(removed.status).toBe(403);
		expect(removed.body.error.code).toBe("not_a_member");
	});
});
// #endregion turbinekit:orgs

// #region turbinekit:admin
describe("Bans", () => {
	it("refuses a banned user's API keys", async () => {
		const banned = await insertUser(db);
		const key = await keyFor(banned.id, ["projects:read"]);
		await db
			.update(schema.user)
			.set({ banned: true })
			.where(eq(schema.user.id, banned.id));
		const response = await call(operations.listProjects, { key });
		expect(response.status).toBe(403);
		expect(response.body.error.code).toBe("account_banned");
	});
});
// #endregion turbinekit:admin

// #region turbinekit:payments
describe("Plans", () => {
	it("caps a free user's projects", async () => {
		const user = await insertUser(db);
		const key = await keyFor(user.id, ["projects:read", "projects:write"]);
		for (const name of ["One", "Two", "Three"]) {
			const created = await call(operations.createProject, {
				key,
				body: { name },
			});
			expect(created.status).toBe(201);
		}
		const fourth = await call(operations.createProject, {
			key,
			body: { name: "Four" },
		});
		expect(fourth.status).toBe(403);
		expect(fourth.body.error.code).toBe("plan_limit_reached");
	});
});
// #endregion turbinekit:payments

describe("OpenAPI", () => {
	it("describes every operation", () => {
		const document = openApiDocument();
		const ids = Object.values(document.paths).flatMap((methods) =>
			Object.values(methods).map(
				(operation) => (operation as { operationId: string }).operationId,
			),
		);
		expect(ids.sort()).toEqual(
			Object.values(operations)
				.map((operation) => operation.id)
				.sort(),
		);
		const create = document.paths["/v1/projects"]?.post as {
			requestBody: {
				content: { "application/json": { schema: { required: string[] } } };
			};
		};
		expect(
			create.requestBody.content["application/json"].schema.required,
		).toEqual(["name"]);
	});
});

describe("MCP", () => {
	async function listTools(key?: string) {
		const response = await createMcpRoute()(
			new Request("http://localhost:3000/mcp", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json, text/event-stream",
					"Mcp-Protocol-Version": "2025-06-18",
					...(key && { Authorization: `Bearer ${key}` }),
				},
				body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
			}),
		);
		return response;
	}

	it("asks an anonymous client to sign in", async () => {
		const response = await listTools();
		expect(response.status).toBe(401);
		expect(response.headers.get("WWW-Authenticate")).toContain(
			"/.well-known/oauth-protected-resource/mcp",
		);
	});

	it("offers only the tools a key's scopes allow", async () => {
		const text = async (response: Response) => await response.text();
		const write = await text(await listTools(writeKey));
		expect(write).toContain("create_project");
		expect(write).toContain("list_projects");
		const read = await text(await listTools(readKey));
		expect(read).toContain("list_projects");
		expect(read).not.toContain("create_project");
	});
});
