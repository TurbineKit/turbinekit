import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import type { ReactNode } from "react";

/** One block of the account settings: a title, a line of help, the controls. */
export function Section({
	title,
	description,
	action,
	children,
}: {
	title: string;
	description?: string;
	action?: ReactNode;
	children: ReactNode;
}) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between gap-4">
				<div className="flex flex-col gap-1.5">
					<CardTitle>{title}</CardTitle>
					{description && <CardDescription>{description}</CardDescription>}
				</div>
				{action}
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}
