export type ApiErrorType =
	| "invalid_request_error"
	| "authentication_error"
	| "permission_error"
	| "not_found_error"
	| "rate_limit_error"
	| "api_error";

/**
 * An error the API answers with: an HTTP status and a stable `code` that
 * clients can branch on. REST returns it as `{ error: { type, code,
 * message, param } }`; MCP tools return its message to the model.
 */
export class ApiError extends Error {
	readonly status: number;
	readonly type: ApiErrorType;
	readonly code: string;
	readonly param: string | undefined;

	constructor(
		status: number,
		type: ApiErrorType,
		code: string,
		message: string,
		param?: string,
	) {
		super(message);
		this.status = status;
		this.type = type;
		this.code = code;
		this.param = param;
	}

	static notFound(what: string): ApiError {
		return new ApiError(
			404,
			"not_found_error",
			"resource_missing",
			`No ${what} with this ID.`,
			"id",
		);
	}

	toJSON() {
		return {
			type: this.type,
			code: this.code,
			message: this.message,
			...(this.param && { param: this.param }),
		};
	}
}
