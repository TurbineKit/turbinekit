"use client";

import { track } from "@repo/analytics/client"; // turbinekit:analytics
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { authErrorMessage } from "@/components/auth/auth-error";
import {
	oauthResumeUrl,
	useOAuthSearch,
	withOAuthSearch,
} from "@/components/auth/oauth-flow";
import { getPathname, Link } from "@/i18n/navigation";
import { signUp } from "@/lib/auth-client";

export function SignUpForm() {
	const t = useTranslations("Auth");
	const te = useTranslations("Auth.errors");
	const locale = useLocale();
	const oauthSearch = useOAuthSearch();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const dashboard = () => getPathname({ href: "/dashboard", locale });

	const onSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setLoading(true);
		setError(null);
		const { error } = await signUp
			.email({
				name,
				email,
				password,
				// The language of the site now: the user's emails use it.
				locale,
				// Where the verification link lands, signed in.
				callbackURL: oauthResumeUrl() ?? dashboard(),
			})
			.catch(() => ({ error: {} }));
		if (error) {
			setError(authErrorMessage(error, te));
			setLoading(false);
			return;
		}
		track("signed_up", { method: "email" }); // turbinekit:analytics
		const verify = getPathname({ href: "/verify-email", locale });
		window.location.assign(`${verify}?email=${encodeURIComponent(email)}`);
	};

	return (
		<div className="flex flex-col gap-6">
			<form onSubmit={onSubmit}>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor="name">{t("name")}</FieldLabel>
						<Input
							id="name"
							autoComplete="name"
							required
							maxLength={100}
							value={name}
							onChange={(event) => setName(event.target.value)}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="email">{t("email")}</FieldLabel>
						<Input
							id="email"
							type="email"
							autoComplete="email"
							required
							value={email}
							onChange={(event) => setEmail(event.target.value)}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="password">{t("password")}</FieldLabel>
						<Input
							id="password"
							type="password"
							autoComplete="new-password"
							required
							minLength={8}
							value={password}
							onChange={(event) => setPassword(event.target.value)}
						/>
						<FieldDescription>{te("passwordShort")}</FieldDescription>
					</Field>
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					<Button type="submit" size="lg" disabled={loading}>
						{t("signUp.submit")}
					</Button>
					<p className="text-xs text-muted-foreground">
						{t.rich("signUp.terms", {
							terms: (chunks) => (
								<Link
									href="/legal/terms"
									className="underline underline-offset-4"
								>
									{chunks}
								</Link>
							),
							privacy: (chunks) => (
								<Link
									href="/legal/privacy"
									className="underline underline-offset-4"
								>
									{chunks}
								</Link>
							),
						})}
					</p>
				</FieldGroup>
			</form>
			<p className="text-center text-sm text-muted-foreground">
				{t("signUp.hasAccount")}{" "}
				<a
					href={withOAuthSearch(
						getPathname({ href: "/sign-in", locale }),
						oauthSearch,
					)}
					className="text-foreground underline underline-offset-4"
				>
					{t("signUp.signIn")}
				</a>
			</p>
		</div>
	);
}
