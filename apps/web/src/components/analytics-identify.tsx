"use client";

import { identifyUser } from "@repo/analytics/client";
import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";

/**
 * Links the browser's events to the signed-in user, once the visitor has
 * accepted measurement. Sign-out resets it (user-menu.tsx).
 */
export function AnalyticsIdentify() {
	const { data } = useSession();
	const id = data?.user.id;
	const email = data?.user.email;
	const createdAt = data?.user.createdAt;
	const created = createdAt ? new Date(createdAt).toISOString() : undefined;
	// #region turbinekit:admin
	// An admin viewing the app as this user is not this user.
	const impersonated = Boolean(data?.session.impersonatedBy);
	// #endregion turbinekit:admin

	useEffect(() => {
		if (impersonated) return; // turbinekit:admin
		if (id && email && created) {
			identifyUser({ id, email, createdAt: created });
		}
	}, [
		id,
		email,
		created,
		impersonated, // turbinekit:admin
	]);

	return null;
}
