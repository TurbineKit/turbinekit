import type { EmailStrings } from "./en.ts";

export const de: EmailStrings = {
	footer:
		"Du erhältst diese E-Mail aufgrund deines Kontos bei {product}. Wenn du das nicht warst, kannst du sie ignorieren.",
	verifyEmail: {
		subject: "Bestätige deine E-Mail-Adresse",
		preview:
			"Bestätige deine E-Mail-Adresse, um die Registrierung abzuschließen.",
		heading: "Bestätige deine E-Mail-Adresse",
		body: "Klicke auf die Schaltfläche unten, um deine E-Mail-Adresse zu bestätigen. Der Link läuft in einer Stunde ab.",
		button: "E-Mail-Adresse bestätigen",
	},
	resetPassword: {
		subject: "Setze dein Passwort zurück",
		preview: "Lege ein neues Passwort für dein Konto fest.",
		heading: "Setze dein Passwort zurück",
		body: "Jemand hat angefordert, das Passwort deines Kontos zurückzusetzen. Wenn du das warst, klicke auf die Schaltfläche unten. Der Link läuft in einer Stunde ab.",
		button: "Neues Passwort festlegen",
	},
	twoFactorCode: {
		subject: "Dein Anmeldecode: {code}",
		preview: "Dein Anmeldecode lautet {code}.",
		heading: "Dein Anmeldecode",
		body: "Gib diesen Code ein, um die Anmeldung abzuschließen. Er läuft in fünf Minuten ab.",
	},
	// #region turbinekit:orgs
	organizationInvite: {
		subject: "{inviter} hat dich zu {organization} eingeladen",
		preview: "Tritt {organization} auf {product} bei.",
		heading: "Tritt {organization} bei",
		body: "{inviter} hat dich eingeladen, dem Team {organization} auf {product} beizutreten.",
		button: "Einladung annehmen",
	},
	// #endregion turbinekit:orgs
};
