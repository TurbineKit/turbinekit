"use client";

import type { useTranslations } from "next-intl";

type AuthError = { code?: string; status?: number } | null | undefined;

type Translate = ReturnType<typeof useTranslations<"Auth.errors">>;

/** better-auth's error codes, in the visitor's language. */
export function authErrorMessage(
	error: AuthError,
	t: Translate,
	fallback?: string,
): string {
	if (error?.status === 429) {
		return t("rateLimited");
	}
	switch (error?.code) {
		case "INVALID_EMAIL_OR_PASSWORD":
		case "INVALID_PASSWORD":
			return t("invalidCredentials");
		case "EMAIL_NOT_VERIFIED":
			return t("emailNotVerified");
		case "USER_ALREADY_EXISTS":
		case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
			return t("userExists");
		case "PASSWORD_TOO_SHORT":
			return t("passwordShort");
		case "INVALID_CODE":
		case "INVALID_TWO_FACTOR_COOKIE":
		case "OTP_HAS_EXPIRED":
		case "INVALID_BACKUP_CODE":
			return t("invalidCode");
		default:
			return fallback ?? t("generic");
	}
}
