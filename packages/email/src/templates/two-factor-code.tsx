import { Text } from "react-email";
import { fill, strings } from "../strings/index.ts";
import { EmailLayout, Paragraph } from "./layout.tsx";

export type TwoFactorCodeProps = { locale: string; code: string };

export function TwoFactorCode({ locale, code }: TwoFactorCodeProps) {
	const t = strings(locale).twoFactorCode;
	return (
		<EmailLayout
			locale={locale}
			preview={fill(t.preview, { code })}
			heading={t.heading}
		>
			<Paragraph>{t.body}</Paragraph>
			<Text
				style={{
					fontFamily: "ui-monospace, Menlo, monospace",
					fontSize: 32,
					fontWeight: 700,
					letterSpacing: 8,
				}}
			>
				{code}
			</Text>
		</EmailLayout>
	);
}

TwoFactorCode.PreviewProps = {
	locale: "en",
	code: "123456",
} satisfies TwoFactorCodeProps;

export default TwoFactorCode;
