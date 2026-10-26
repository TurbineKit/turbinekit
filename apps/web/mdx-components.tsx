import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";

/** Internal links keep the reader's locale. */
function Anchor({ href = "", ...props }: ComponentProps<"a">) {
	return href.startsWith("/") ? (
		<Link href={href} {...props} />
	) : (
		<a href={href} rel="noopener" {...props} />
	);
}

/** Wide tables scroll inside the text column instead of widening the page. */
function Table(props: ComponentProps<"table">) {
	return (
		<div className="overflow-x-auto">
			<table {...props} />
		</div>
	);
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
	return { a: Anchor, table: Table, ...components };
}
