"use client";

import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { getPathname, Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

/**
 * Asks for a reset link. The answer is the same whether an account uses the
 * address or not, so the form can't tell anyone who has an account.
 */
export function ForgotPasswordForm() {
	const t = useTranslations("Auth");
	const locale = useLocale();
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);

	const onSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setLoading(true);
		await authClient
			.requestPasswordReset({
				email,
				redirectTo: getPathname({ href: "/reset-password", locale }),
			})
			.catch(() => null);
		setLoading(false);
		setSent(true);
	};

	return (
		<form onSubmit={onSubmit}>
			<FieldGroup>
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
				{sent && (
					<Alert>
						<AlertDescription>{t("forgot.sent")}</AlertDescription>
					</Alert>
				)}
				<Button type="submit" size="lg" disabled={loading || sent}>
					{t("forgot.submit")}
				</Button>
				<Link
					href="/sign-in"
					className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
				>
					{t("forgot.back")}
				</Link>
			</FieldGroup>
		</form>
	);
}
