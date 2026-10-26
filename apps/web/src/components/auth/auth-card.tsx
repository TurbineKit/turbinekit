import type { ReactNode } from "react";

/** The frame of every auth page: a title, a line of help, the form. */
export function AuthCard({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: ReactNode;
}) {
	return (
		<main className="flex w-full max-w-sm flex-col gap-6">
			<div className="flex flex-col gap-2 text-center">
				<h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
				{description && <p className="text-muted-foreground">{description}</p>}
			</div>
			{children}
		</main>
	);
}
