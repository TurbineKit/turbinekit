import type { Instrumentation } from "next";

/** Unhandled server errors go to PostHog error tracking. */
export const onRequestError: Instrumentation.onRequestError = async (
	error,
	request,
	context,
) => {
	if (process.env.NEXT_RUNTIME !== "nodejs") return;
	const { captureException } = await import("@repo/analytics/server");
	await captureException(error, {
		path: request.path.split("?")[0],
		method: request.method,
		route: context.routePath,
		routeType: context.routeType,
	});
};
