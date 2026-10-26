import { fill, strings } from "../strings/index.ts";
import { ActionButton, EmailLayout, Paragraph } from "./layout.tsx";

export type OrganizationInviteProps = {
	locale: string;
	url: string;
	organization: string;
	inviter: string;
};

export function OrganizationInvite({
	locale,
	url,
	organization,
	inviter,
}: OrganizationInviteProps) {
	const t = strings(locale).organizationInvite;
	const values = { organization, inviter };
	return (
		<EmailLayout
			locale={locale}
			preview={fill(t.preview, values)}
			heading={fill(t.heading, values)}
		>
			<Paragraph>{fill(t.body, values)}</Paragraph>
			<ActionButton href={url}>{t.button}</ActionButton>
		</EmailLayout>
	);
}

OrganizationInvite.PreviewProps = {
	locale: "en",
	url: "http://localhost:3000/org/invitations/inv_preview",
	organization: "Acme",
	inviter: "Ada Lovelace",
} satisfies OrganizationInviteProps;

export default OrganizationInvite;
