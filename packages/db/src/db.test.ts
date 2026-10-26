import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createId } from "./id.ts";
import { project } from "./schema/app.ts";
import { createTestDb, insertUser, type TestDb } from "./testing.ts";

describe("createId", () => {
	it("makes prefixed base62 IDs", () => {
		const id = createId("prj");
		expect(id).toMatch(/^prj_[0-9A-Za-z]{16}$/);
		expect(createId("prj")).not.toBe(id);
	});
});

describe("migrations", () => {
	let db: TestDb;
	let close: () => Promise<void>;

	beforeAll(async () => {
		({ db, close } = await createTestDb());
	});
	afterAll(async () => {
		await close();
	});

	it("apply on an empty database, and the schema accepts rows", async () => {
		const owner = await insertUser(db);
		const [row] = await db
			.insert(project)
			.values({ name: "First", ownerId: owner.id })
			.returning();
		expect(row?.id).toMatch(/^prj_/);
		expect(row?.createdAt).toBeInstanceOf(Date);
	});
});
