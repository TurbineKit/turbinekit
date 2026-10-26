import { getAuth } from "@repo/auth";
import { createId } from "@repo/db";
import { putFile } from "@repo/storage";
import { headers } from "next/headers";
import sharp from "sharp";
import { isSameOrigin } from "@/lib/same-origin";

/** Uploads are small: Vercel Functions accept bodies up to 4.5 MB. */
const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPTED = new Set([
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif",
]);

function refuse(status: number, code: string) {
	return Response.json({ error: { code } }, { status });
}

/**
 * The signed-in user's picture: resized to 256×256 WebP (the original is
 * never kept), stored under a new key, and set as `user.image`.
 */
export async function POST(request: Request) {
	if (!isSameOrigin(request)) {
		return refuse(403, "cross_origin");
	}
	const requestHeaders = await headers();
	const session = await getAuth().api.getSession({ headers: requestHeaders });
	if (!session) {
		return refuse(401, "unauthenticated");
	}
	const form = await request.formData().catch(() => null);
	const file = form?.get("file");
	if (!(file instanceof File)) {
		return refuse(400, "missing_file");
	}
	if (!ACCEPTED.has(file.type)) {
		return refuse(415, "unsupported_type");
	}
	if (file.size > MAX_BYTES) {
		return refuse(413, "too_large");
	}

	const webp = await sharp(Buffer.from(await file.arrayBuffer()))
		.rotate()
		.resize(256, 256, { fit: "cover" })
		.webp({ quality: 85 })
		.toBuffer()
		.catch(() => null);
	if (!webp) {
		return refuse(400, "invalid_image");
	}

	const key = `avatars/${session.user.id}/${createId("img")}.webp`;
	const url = await putFile(key, new Uint8Array(webp), "image/webp");
	await getAuth().api.updateUser({
		body: { image: url },
		headers: requestHeaders,
	});
	return Response.json({ url });
}
