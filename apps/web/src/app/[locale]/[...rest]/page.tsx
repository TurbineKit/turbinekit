import { notFound } from "next/navigation";

/** An address no page answers: the not-found page, in the visitor's language. */
export default function UnknownPage() {
	notFound();
}
