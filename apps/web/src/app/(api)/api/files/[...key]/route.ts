import { isSafeKey, readFile } from "@repo/storage";

/**
 * Serves stored files when the store has no public URL of its own (the
 * local driver). Keys are unique per upload, so responses cache forever.
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ key: string[] }> },
) {
	const key = (await params).key.join("/");
	if (!isSafeKey(key)) {
		return new Response("Not found", { status: 404 });
	}
	const file = await readFile(key);
	if (!file) {
		return new Response("Not found", { status: 404 });
	}
	return new Response(file.stream(), {
		headers: {
			"Content-Type": file.type || "application/octet-stream",
			"Cache-Control": "public, max-age=31536000, immutable",
			"X-Content-Type-Options": "nosniff",
		},
	});
}
