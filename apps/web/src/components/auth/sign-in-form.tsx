"use client";

import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { FingerprintIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { authErrorMessage } from "@/components/auth/auth-error";
import {
	followOAuthRedirect,
	oauthResumeUrl,
	useOAuthSearch,
	withOAuthSearch,
} from "@/components/auth/oauth-flow";
import { getPathname, Link } from "@/i18n/navigation";
import { signIn } from "@/lib/auth-client";
import { safeNext } from "@/lib/oauth-query";

export function SignInForm() {
	const t = useTranslations("Auth");
	const te = useTranslations("Auth.errors");
	const locale = useLocale();
	const oauthSearch = useOAuthSearch();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/** Where to go after signing in: `next`, else the dashboard. */
	const destination = () =>
		safeNext(new URLSearchParams(window.location.search).get("next")) ??
		getPathname({ href: "/dashboard", locale });

	const onSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setLoading(true);
		setError(null);
		const { data, error } = await signIn
			.email({
				email,
				password,
				// Also where the verification link lands for unverified users; in an
				// OAuth flow, it resumes that flow.
				callbackURL: oauthResumeUrl() ?? destination(),
			})
			.catch(() => ({ data: null, error: {} }));
		if (error) {
			setError(authErrorMessage(error, te));
			setLoading(false);
			return;
		}
		if (followOAuthRedirect(data)) {
			return;
		}
		// better-auth's client follows `callbackURL` itself; the form stays busy.
		if (data && !("redirect" in data && data.redirect)) {
			window.location.assign(destination());
		}
	};

	const onPasskey = async () => {
		setLoading(true);
		setError(null);
		const { data, error } = await signIn
			.passkey()
			.catch(() => ({ data: null, error: {} }));
		if (error || !data) {
			setError(authErrorMessage(error, te, te("passkeyFailed")));
			setLoading(false);
			return;
		}
		if (!followOAuthRedirect(data)) {
			window.location.assign(destination());
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<form onSubmit={onSubmit}>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor="email">{t("email")}</FieldLabel>
						<Input
							id="email"
							type="email"
							autoComplete="username webauthn"
							required
							value={email}
							onChange={(event) => setEmail(event.target.value)}
						/>
					</Field>
					<Field>
						<div className="flex items-center justify-between">
							<FieldLabel htmlFor="password">{t("password")}</FieldLabel>
							<Link
								href="/forgot-password"
								className="text-sm text-muted-foreground underline-offset-4 hover:underline"
							>
								{t("signIn.forgot")}
							</Link>
						</div>
						<Input
							id="password"
							type="password"
							autoComplete="current-password webauthn"
							required
							value={password}
							onChange={(event) => setPassword(event.target.value)}
						/>
					</Field>
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					<Button type="submit" size="lg" disabled={loading}>
						{t("signIn.submit")}
					</Button>
					<Button
						type="button"
						variant="outline"
						size="lg"
						disabled={loading}
						onClick={onPasskey}
					>
						<FingerprintIcon />
						{t("signIn.passkey")}
					</Button>
				</FieldGroup>
			</form>
			<p className="text-center text-sm text-muted-foreground">
				{t("signIn.noAccount")}{" "}
				<a
					href={withOAuthSearch(
						getPathname({ href: "/sign-up", locale }),
						oauthSearch,
					)}
					className="text-foreground underline underline-offset-4"
				>
					{t("signIn.signUp")}
				</a>
			</p>
		</div>
	);
}
