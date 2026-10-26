import { and, eq, lt, or, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { ApiError } from "./errors.ts";

/**
 * Lists come newest first, a page at a time, with an opaque cursor: the
 * last row's creation time and ID. The time round-trips exactly because
 * `createdAt` columns keep milliseconds (`precision: 3`), like JavaScript
 * dates; with microseconds, rows in the same millisecond would be skipped.
 */
export function encodeCursor(row: { createdAt: Date; id: string }): string {
	return Buffer.from(`${row.createdAt.toISOString()}|${row.id}`).toString(
		"base64url",
	);
}

export function decodeCursor(cursor: string): { createdAt: Date; id: string } {
	const [time, id] = Buffer.from(cursor, "base64url").toString().split("|");
	const createdAt = new Date(time ?? "");
	if (!id || Number.isNaN(createdAt.getTime())) {
		throw new ApiError(
			400,
			"invalid_request_error",
			"invalid_cursor",
			"The cursor is not valid. Use the nextCursor of a previous page.",
			"cursor",
		);
	}
	return { createdAt, id };
}

/**
 * The rows after a cursor. Use with
 * `.orderBy(desc(table.createdAt), desc(table.id)).limit(limit + 1)`.
 */
export function afterCursor(
	table: { createdAt: PgColumn; id: PgColumn },
	cursor: string | undefined,
): SQL | undefined {
	if (!cursor) {
		return undefined;
	}
	const after = decodeCursor(cursor);
	return or(
		lt(table.createdAt, after.createdAt),
		and(eq(table.createdAt, after.createdAt), lt(table.id, after.id)),
	);
}

/** A page from `limit + 1` rows: the items, and the next page's cursor. */
export function toPage<Row extends { createdAt: Date; id: string }, Item>(
	rows: Row[],
	limit: number,
	toItem: (row: Row) => Item,
): { data: Item[]; nextCursor: string | null } {
	const page = rows.slice(0, limit);
	const last = page.at(-1);
	return {
		data: page.map(toItem),
		nextCursor: rows.length > limit && last ? encodeCursor(last) : null,
	};
}
