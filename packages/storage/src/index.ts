import { resolve } from "node:path";
import { Files } from "files-sdk";
import { keys } from "./keys.ts";

let files: Files | undefined;

/**
 * The configured store, built on first use. Each adapter is imported only
 * when chosen, so a driver you don't use needs none of its packages.
 */
export async function getFiles(): Promise<Files> {
	if (files) {
		return files;
	}
	const env = keys();
	switch (env.STORAGE_DRIVER) {
		// #region turbinekit:files-s3
		case "s3": {
			if (
				!(env.S3_BUCKET && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY)
			) {
				throw new Error(
					"STORAGE_DRIVER=s3 needs S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.",
				);
			}
			const { s3 } = await import("files-sdk/s3");
			files = new Files({
				adapter: s3({
					bucket: env.S3_BUCKET,
					region: env.S3_REGION,
					endpoint: env.S3_ENDPOINT,
					credentials: {
						accessKeyId: env.S3_ACCESS_KEY_ID,
						secretAccessKey: env.S3_SECRET_ACCESS_KEY,
					},
					publicBaseUrl: env.STORAGE_PUBLIC_URL,
				}),
			});
			break;
		}
		// #endregion turbinekit:files-s3
		// #region turbinekit:files-blob
		case "vercel-blob": {
			const { vercelBlob } = await import("files-sdk/vercel-blob");
			files = new Files({
				adapter: vercelBlob({
					token: env.BLOB_READ_WRITE_TOKEN,
					access: "public",
				}),
			});
			break;
		}
		// #endregion turbinekit:files-blob
		default: {
			const { fs } = await import("files-sdk/fs");
			files = new Files({
				adapter: fs({
					root: env.STORAGE_LOCAL_ROOT ?? resolve(process.cwd(), ".storage"),
				}),
			});
		}
	}
	return files;
}

/** Stores a file under `key` and returns the URL to show it. */
export async function putFile(
	key: string,
	body: Uint8Array | Blob | string,
	contentType: string,
): Promise<string> {
	const store = await getFiles();
	await store.upload(key, body, {
		contentType,
		cacheControl: "public, max-age=31536000, immutable",
	});
	return publicUrl(key);
}

/** Reads a stored file, for the app's own file route (local driver). */
export async function readFile(key: string) {
	const store = await getFiles();
	if (!(await store.exists(key))) {
		return null;
	}
	return store.download(key);
}

/**
 * A file's public URL: the store's base URL when there is one, else the app
 * serves it at /api/files/<key>.
 */
export function publicUrl(key: string): string {
	const base = keys().STORAGE_PUBLIC_URL?.replace(/\/+$/, "");
	return base ? `${base}/${key}` : `/api/files/${key}`;
}

/** Keys are made by the app; this keeps a request from reaching outside them. */
export function isSafeKey(key: string): boolean {
	return (
		/^[\w-]+(\/[\w.-]+)+$/.test(key) &&
		!key.split("/").some((part) => part === ".." || part === ".")
	);
}
