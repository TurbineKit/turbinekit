import { strings } from "../strings/index.ts";
import { ActionButton, EmailLayout, Paragraph } from "./layout.tsx";

export type ResetPasswordProps = { locale: string; url: string };

export function ResetPassword({ locale, url }: ResetPasswordProps) {
	const t = strings(locale).resetPassword;
	return (
		<EmailLayout locale={locale} preview={t.preview} heading={t.heading}>
			<Paragraph>{t.body}</Paragraph>
			<ActionButton href={url}>{t.button}</ActionButton>
		</EmailLayout>
	);
}

ResetPassword.PreviewProps = {
	locale: "en",
	url: "http://localhost:3000/reset-password?token=preview",
} satisfies ResetPasswordProps;

export default ResetPassword;
