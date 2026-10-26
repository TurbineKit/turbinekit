import type { EmailStrings } from "./en.ts";

export const ptBR: EmailStrings = {
	footer:
		"Você recebeu este e-mail por causa da sua conta {product}. Se não foi você, pode ignorá-lo.",
	verifyEmail: {
		subject: "Verifique seu endereço de e-mail",
		preview:
			"Confirme seu endereço de e-mail para concluir a criação da sua conta.",
		heading: "Confirme seu endereço de e-mail",
		body: "Clique no botão abaixo para verificar seu endereço de e-mail. O link expira em uma hora.",
		button: "Verificar e-mail",
	},
	resetPassword: {
		subject: "Redefina sua senha",
		preview: "Escolha uma nova senha para sua conta.",
		heading: "Redefina sua senha",
		body: "Alguém pediu para redefinir a senha da sua conta. Se foi você, clique no botão abaixo. O link expira em uma hora.",
		button: "Escolher uma nova senha",
	},
	twoFactorCode: {
		subject: "Seu código de login: {code}",
		preview: "Seu código de login é {code}.",
		heading: "Seu código de login",
		body: "Digite este código para concluir o login. Ele expira em cinco minutos.",
	},
	// #region turbinekit:orgs
	organizationInvite: {
		subject: "{inviter} convidou você para a equipe {organization}",
		preview: "Participe de {organization} em {product}.",
		heading: "Participe de {organization}",
		body: "{inviter} convidou você para participar da equipe {organization} em {product}.",
		button: "Aceitar o convite",
	},
	// #endregion turbinekit:orgs
};
