import { strings } from "../strings/index.ts";
import { ActionButton, EmailLayout, Paragraph } from "./layout.tsx";

export type VerifyEmailProps = { locale: string; url: string };

export function VerifyEmail({ locale, url }: VerifyEmailProps) {
	const t = strings(locale).verifyEmail;
	return (
		<EmailLayout locale={locale} preview={t.preview} heading={t.heading}>
			<Paragraph>{t.body}</Paragraph>
			<ActionButton href={url}>{t.button}</ActionButton>
		</EmailLayout>
	);
}

VerifyEmail.PreviewProps = {
	locale: "en",
	url: "http://localhost:3000/api/auth/verify-email?token=preview",
} satisfies VerifyEmailProps;

export default VerifyEmail;
