import type { EmailStrings } from "./en.ts";

export const fr: EmailStrings = {
	footer:
		"Vous recevez ce courriel en raison de votre compte {product}. Si ce n’était pas vous, ignorez-le.",
	verifyEmail: {
		subject: "Vérifiez votre adresse courriel",
		preview:
			"Confirmez votre adresse courriel pour terminer votre inscription.",
		heading: "Confirmez votre adresse courriel",
		body: "Cliquez sur le bouton ci-dessous pour vérifier votre adresse courriel. Le lien expire dans une heure.",
		button: "Vérifier l’adresse",
	},
	resetPassword: {
		subject: "Réinitialisez votre mot de passe",
		preview: "Choisissez un nouveau mot de passe pour votre compte.",
		heading: "Réinitialisez votre mot de passe",
		body: "Quelqu’un a demandé la réinitialisation du mot de passe de votre compte. Si c’était vous, cliquez sur le bouton ci-dessous. Le lien expire dans une heure.",
		button: "Choisir un nouveau mot de passe",
	},
	twoFactorCode: {
		subject: "Votre code de connexion : {code}",
		preview: "Votre code de connexion est {code}.",
		heading: "Votre code de connexion",
		body: "Entrez ce code pour terminer la connexion. Il expire dans cinq minutes.",
	},
	// #region turbinekit:orgs
	organizationInvite: {
		subject: "{inviter} vous invite dans {organization}",
		preview: "Rejoignez {organization} sur {product}.",
		heading: "Rejoignez {organization}",
		body: "{inviter} vous invite à rejoindre l’équipe {organization} sur {product}.",
		button: "Accepter l’invitation",
	},
	// #endregion turbinekit:orgs
};
