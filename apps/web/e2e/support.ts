import {
	type APIRequestContext,
	expect,
	type Page,
	test,
} from "@playwright/test";

export const PASSWORD = "correct-horse-battery-staple";

export type User = { name: string; email: string; password: string };

let count = 0;

/** The app's origin: better-auth refuses writes without an Origin header. */
function origin(): string {
	return new URL(test.info().project.use.baseURL ?? "http://localhost:3000")
		.origin;
}

/**
 * A different client address per call: better-auth limits sign-ups and
 * sign-ins per address, and every test request comes from localhost.
 */
export function clientIp(): string {
	count++;
	return `198.51.100.${(count % 250) + 1}`;
}

/** A fresh address per test run, so tests never collide. */
export function newUser(name: string): User {
	const id = `${Date.now()}-${count++}`;
	return {
		name,
		email: `${name.toLowerCase().replace(/\W+/g, ".")}+${id}@example.com`,
		password: PASSWORD,
	};
}

/** A link from the dev mailbox (EMAIL_TRANSPORT=console). */
export async function linkFromMailbox(
	request: APIRequestContext,
	to: string,
	pattern: RegExp,
): Promise<string> {
	let link: string | undefined;
	await expect
		.poll(
			async () => {
				const response = await request.get(
					`/api/dev/mailbox?to=${encodeURIComponent(to)}`,
				);
				const mails = (await response.json()) as { text: string }[];
				link = mails.map((mail) => mail.text.match(pattern)?.[0]).find(Boolean);
				return link;
			},
			{ timeout: 15_000 },
		)
		.toBeTruthy();
	return link as string;
}

/** Signs up and verifies by the emailed link: the account can sign in. */
export async function createUser(
	request: APIRequestContext,
	name: string,
): Promise<User> {
	const user = newUser(name);
	const response = await request.post("/api/auth/sign-up/email", {
		data: { ...user, callbackURL: "/dashboard" },
		headers: { origin: origin(), "x-forwarded-for": clientIp() },
	});
	expect(response.ok(), await response.text()).toBe(true);
	const link = await linkFromMailbox(
		request,
		user.email,
		/https?:\/\/\S+verify-email\S+/,
	);
	await request.get(link, { maxRedirects: 0 });
	return user;
}

/** Signs the page's browser in (the cookies land in its context). */
export async function signIn(page: Page, user: User): Promise<void> {
	const response = await page.request.post("/api/auth/sign-in/email", {
		data: { email: user.email, password: user.password },
		headers: { origin: origin(), "x-forwarded-for": clientIp() },
	});
	expect(response.ok(), await response.text()).toBe(true);
}

// #region turbinekit:consent
/**
 * Refuses optional cookies, so the banner stays out of the way. The choice
 * is saved once the banner hydrates: wait for its cookie.
 */
export async function dismissConsent(page: Page): Promise<void> {
	await page.goto("/");
	const banner = page.getByTestId("consent-banner-root");
	await banner.getByRole("button", { name: /reject|rejeter/i }).click();
	await expect(banner).toBeHidden();
	await expect
		.poll(async () =>
			(await page.context().cookies()).some((cookie) => cookie.name === "c15t"),
		)
		.toBe(true);
}
// #endregion turbinekit:consent
