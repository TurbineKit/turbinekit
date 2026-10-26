import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Storage settings, validated on first use. `local` keeps files on disk
 * (development, or a server with a persistent disk); `s3` works with any
 * S3-compatible store; `vercel-blob` uses Vercel Blob.
 */
export function keys() {
	return createEnv({
		server: {
			STORAGE_DRIVER: z.enum(["local", "s3", "vercel-blob"]).default("local"),
			/** Public base URL of stored files (CDN or public bucket). Without it, the app serves them. */
			STORAGE_PUBLIC_URL: z.url().optional(),
			/** Where `local` keeps files. Default: .storage in the app's folder. */
			STORAGE_LOCAL_ROOT: z.string().optional(),
			// #region turbinekit:files-s3
			S3_ENDPOINT: z.url().optional(),
			S3_REGION: z.string().default("auto"),
			S3_BUCKET: z.string().optional(),
			S3_ACCESS_KEY_ID: z.string().optional(),
			S3_SECRET_ACCESS_KEY: z.string().optional(),
			// #endregion turbinekit:files-s3
			BLOB_READ_WRITE_TOKEN: z.string().optional(), // turbinekit:files-blob
		},
		runtimeEnv: process.env,
		emptyStringAsUndefined: true,
		skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
	});
}
