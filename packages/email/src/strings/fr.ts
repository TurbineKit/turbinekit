import type { EmailStrings } from "./en.ts";

export const fr: EmailStrings = {
	footer:
		"Tu reçois ce courriel en raison de ton compte {product}. Si ce n’était pas toi, ignore-le.",
	verifyEmail: {
		subject: "Vérifie ton adresse courriel",
		preview: "Confirme ton adresse courriel pour terminer ton inscription.",
		heading: "Confirme ton adresse courriel",
		body: "Clique sur le bouton ci-dessous pour vérifier ton adresse courriel. Le lien expire dans une heure.",
		button: "Vérifier l’adresse",
	},
	resetPassword: {
		subject: "Réinitialise ton mot de passe",
		preview: "Choisis un nouveau mot de passe pour ton compte.",
		heading: "Réinitialise ton mot de passe",
		body: "Quelqu’un a demandé la réinitialisation du mot de passe de ton compte. Si c’était toi, clique sur le bouton ci-dessous. Le lien expire dans une heure.",
		button: "Choisir un nouveau mot de passe",
	},
	twoFactorCode: {
		subject: "Ton code de connexion : {code}",
		preview: "Ton code de connexion est {code}.",
		heading: "Ton code de connexion",
		body: "Entre ce code pour terminer la connexion. Il expire dans cinq minutes.",
	},
	// #region turbinekit:orgs
	organizationInvite: {
		subject: "{inviter} t’invite dans {organization}",
		preview: "Rejoins {organization} sur {product}.",
		heading: "Rejoins {organization}",
		body: "{inviter} t’invite à rejoindre l’équipe {organization} sur {product}.",
		button: "Accepter l’invitation",
	},
	// #endregion turbinekit:orgs
};
