/**
 * What a caller may do, in one vocabulary for every door into the app. API
 * keys carry these as permissions (`{ projects: ["read"] }`); OAuth tokens
 * for MCP clients carry them as scopes (`projects:read`). Operations in
 * packages/api declare the scope they need.
 */
export const PERMISSIONS = {
	projects: ["read", "write"],
} as const;

type Resource = keyof typeof PERMISSIONS;

/** `projects:read`, `projects:write`, … */
export type Scope = {
	[R in Resource]: `${R}:${(typeof PERMISSIONS)[R][number]}`;
}[Resource];

export const ALL_SCOPES = Object.entries(PERMISSIONS).flatMap(
	([resource, actions]) => actions.map((action) => `${resource}:${action}`),
) as Scope[];

export function isScope(value: string): value is Scope {
	return (ALL_SCOPES as string[]).includes(value);
}

/** API key permissions → scopes. Unknown entries are ignored. */
export function scopesFromPermissions(
	permissions: Record<string, string[]> | null | undefined,
): Scope[] {
	return Object.entries(permissions ?? {})
		.flatMap(([resource, actions]) =>
			actions.map((action) => `${resource}:${action}`),
		)
		.filter(isScope);
}

/** Scopes → API key permissions. */
export function permissionsFromScopes(
	scopes: readonly Scope[],
): Record<string, string[]> {
	const permissions: Record<string, string[]> = {};
	for (const scope of scopes) {
		const [resource, action] = scope.split(":") as [string, string];
		permissions[resource] = [...(permissions[resource] ?? []), action];
	}
	return permissions;
}
