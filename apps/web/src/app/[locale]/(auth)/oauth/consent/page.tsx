import { verifyOAuthQueryParams } from "@better-auth/oauth-provider";
import { getAuth } from "@repo/auth";
import { OAUTH_SCOPES } from "@repo/auth/oauth";
import { site } from "@repo/site";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Skeleton } from "@repo/ui/components/skeleton";
import { CheckIcon } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { ConsentActions } from "@/components/auth/consent-actions";
import { redirect } from "@/i18n/navigation";
import { hostOf, searchParamsFrom, signedOAuthQuery } from "@/lib/oauth-query";
import { getSession } from "@/lib/session";

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("Auth.consent");
	return { title: t("allow") };
}

/**
 * Where an MCP client (Claude, ChatGPT, Cursor…) asks to act on the user's
 * account. The page trusts only the signed query and the client record.
 */
export default function ConsentPage({ searchParams }: Props) {
	return (
		<Suspense fallback={<Skeleton className="h-72 w-full max-w-sm" />}>
			<Consent searchParams={searchParams} />
		</Suspense>
	);
}

async function Consent({ searchParams }: Props) {
	const t = await getTranslations("Auth.consent");
	const search = searchParamsFrom(await searchParams);
	const query = signedOAuthQuery(search);
	const auth = getAuth();
	const { secret } = await auth.$context;
	if (!(query && (await verifyOAuthQueryParams(query, secret)))) {
		return (
			<Alert variant="destructive" className="max-w-sm">
				<AlertDescription>{t("invalid")}</AlertDescription>
			</Alert>
		);
	}
	const session = await getSession();
	if (!session) {
		redirect({ href: `/sign-in?${search}`, locale: await getLocale() });
	}

	const clientId = search.get("client_id") ?? "";
	const client = await auth.api
		.getOAuthClientPublic({
			query: { client_id: clientId },
			headers: await headers(),
		})
		.catch(() => null);
	if (!client) {
		return (
			<Alert variant="destructive" className="max-w-sm">
				<AlertDescription>{t("error")}</AlertDescription>
			</Alert>
		);
	}
	const name = client.client_name || hostOf(clientId) || clientId;
	const redirectHost = hostOf(search.get("redirect_uri"));
	const scopes = (search.get("scope") ?? "").split(" ").filter(Boolean);
	const known = new Set<string>(OAUTH_SCOPES);

	return (
		<AuthCard
			title={t("title", { client: name })}
			description={t("description", { client: name, product: site.name })}
		>
			<div className="flex flex-col gap-3 rounded-lg border p-4">
				<p className="text-sm font-medium">{t("scopesTitle")}</p>
				<ul className="flex flex-col gap-2 text-sm">
					{scopes
						.filter((scope) => known.has(scope))
						.map((scope) => (
							<li key={scope} className="flex gap-2">
								<CheckIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
								{t(`scope.${scope as (typeof OAUTH_SCOPES)[number]}`)}
							</li>
						))}
				</ul>
			</div>
			<p className="text-xs text-muted-foreground">
				{t("signedInAs", { email: session.user.email })}
				{redirectHost && ` · ${t("redirectsTo", { host: redirectHost })}`}
			</p>
			<ConsentActions />
		</AuthCard>
	);
}
