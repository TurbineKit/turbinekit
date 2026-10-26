/** Email text in English. `{name}` style placeholders are filled by `fill`. */
export const en = {
	footer:
		"You received this email because of your account at {product}. If it wasn't you, you can ignore it.",
	verifyEmail: {
		subject: "Verify your email address",
		preview: "Confirm your email address to finish signing up.",
		heading: "Confirm your email address",
		body: "Click the button below to verify your email address. The link expires in one hour.",
		button: "Verify email",
	},
	resetPassword: {
		subject: "Reset your password",
		preview: "Choose a new password for your account.",
		heading: "Reset your password",
		body: "Someone asked to reset the password of your account. If it was you, click the button below. The link expires in one hour.",
		button: "Choose a new password",
	},
	twoFactorCode: {
		subject: "Your sign-in code: {code}",
		preview: "Your sign-in code is {code}.",
		heading: "Your sign-in code",
		body: "Enter this code to finish signing in. It expires in five minutes.",
	},
	// #region turbinekit:orgs
	organizationInvite: {
		subject: "{inviter} invited you to {organization}",
		preview: "Join {organization} on {product}.",
		heading: "Join {organization}",
		body: "{inviter} invited you to join the team {organization} on {product}.",
		button: "Accept the invitation",
	},
	// #endregion turbinekit:orgs
};

export type EmailStrings = typeof en;
