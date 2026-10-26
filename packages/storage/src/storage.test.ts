import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { isSafeKey, publicUrl, putFile, readFile } from "./index.ts";

let root: string;

beforeAll(async () => {
	root = await mkdtemp(join(tmpdir(), "storage-test-"));
	process.env.STORAGE_DRIVER = "local";
	process.env.STORAGE_LOCAL_ROOT = root;
});

afterAll(async () => {
	await rm(root, { recursive: true, force: true });
});

describe("isSafeKey", () => {
	it("accepts the keys the app makes", () => {
		expect(isSafeKey("avatars/usr_123/img_456.webp")).toBe(true);
	});

	it("refuses paths that could leave the store", () => {
		expect(isSafeKey("avatars/../secrets.txt")).toBe(false);
		expect(isSafeKey("/etc/passwd")).toBe(false);
		expect(isSafeKey("avatars")).toBe(false);
		expect(isSafeKey("avatars/./x.webp")).toBe(false);
	});
});

describe("local driver", () => {
	it("stores a file and reads it back from the app's route", async () => {
		const url = await putFile("avatars/usr_1/a.txt", "hello", "text/plain");
		expect(url).toBe("/api/files/avatars/usr_1/a.txt");
		const file = await readFile("avatars/usr_1/a.txt");
		expect(await file?.text()).toBe("hello");
	});

	it("returns null for a missing file", async () => {
		expect(await readFile("avatars/usr_1/missing.txt")).toBeNull();
	});

	it("uses the public base URL when one is set", () => {
		process.env.STORAGE_PUBLIC_URL = "https://cdn.example.com/";
		expect(publicUrl("avatars/a.webp")).toBe(
			"https://cdn.example.com/avatars/a.webp",
		);
		delete process.env.STORAGE_PUBLIC_URL;
	});
});
