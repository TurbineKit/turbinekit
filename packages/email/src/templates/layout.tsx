import { site, siteUrl } from "@repo/site";
import type { ReactNode } from "react";
import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Text,
} from "react-email";
import { fill, strings } from "../strings/index.ts";

const colors = { ink: "#0a0a0a", muted: "#737373", border: "#e5e5e5" };

/** The frame every email shares: brand, heading, content, footer. */
export function EmailLayout({
	locale,
	preview,
	heading,
	children,
}: {
	locale: string;
	preview: string;
	heading: string;
	children: ReactNode;
}) {
	return (
		<Html lang={locale}>
			<Head />
			<Preview>{preview}</Preview>
			<Body
				style={{
					backgroundColor: "#ffffff",
					color: colors.ink,
					fontFamily:
						"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
				}}
			>
				<Container
					style={{ maxWidth: 480, margin: "0 auto", padding: "32px 24px" }}
				>
					<Link
						href={siteUrl()}
						style={{
							color: colors.ink,
							fontWeight: 600,
							textDecoration: "none",
						}}
					>
						{site.name}
					</Link>
					<Heading as="h1" style={{ fontSize: 22, margin: "32px 0 16px" }}>
						{heading}
					</Heading>
					{children}
					<Hr style={{ borderColor: colors.border, margin: "32px 0 16px" }} />
					<Text
						style={{ color: colors.muted, fontSize: 12, lineHeight: "18px" }}
					>
						{fill(strings(locale).footer)}
					</Text>
				</Container>
			</Body>
		</Html>
	);
}

export function Paragraph({ children }: { children: ReactNode }) {
	return <Text style={{ fontSize: 15, lineHeight: "24px" }}>{children}</Text>;
}

export function ActionButton({
	href,
	children,
}: {
	href: string;
	children: ReactNode;
}) {
	return (
		<Button
			href={href}
			style={{
				backgroundColor: colors.ink,
				borderRadius: 8,
				color: "#ffffff",
				fontSize: 15,
				fontWeight: 600,
				padding: "12px 20px",
				textDecoration: "none",
			}}
		>
			{children}
		</Button>
	);
}
