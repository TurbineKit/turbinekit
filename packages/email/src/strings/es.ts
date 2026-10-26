import type { EmailStrings } from "./en.ts";

export const es: EmailStrings = {
	footer:
		"Recibes este correo en relación con tu cuenta de {product}. Si no fuiste tú, puedes ignorarlo.",
	verifyEmail: {
		subject: "Verifica tu dirección de correo electrónico",
		preview:
			"Confirma tu dirección de correo electrónico para terminar de crear tu cuenta.",
		heading: "Confirma tu dirección de correo electrónico",
		body: "Haz clic en el botón de abajo para verificar tu dirección de correo electrónico. El enlace caduca en una hora.",
		button: "Verificar correo electrónico",
	},
	resetPassword: {
		subject: "Restablece tu contraseña",
		preview: "Elige una nueva contraseña para tu cuenta.",
		heading: "Restablece tu contraseña",
		body: "Alguien pidió restablecer la contraseña de tu cuenta. Si fuiste tú, haz clic en el botón de abajo. El enlace caduca en una hora.",
		button: "Elegir una nueva contraseña",
	},
	twoFactorCode: {
		subject: "Tu código de inicio de sesión: {code}",
		preview: "Tu código de inicio de sesión es {code}.",
		heading: "Tu código de inicio de sesión",
		body: "Escribe este código para terminar de iniciar sesión. Caduca en cinco minutos.",
	},
	// #region turbinekit:orgs
	organizationInvite: {
		subject: "{inviter} te invitó a unirte a {organization}",
		preview: "Únete a {organization} en {product}.",
		heading: "Únete a {organization}",
		body: "{inviter} te invitó a unirte al equipo {organization} en {product}.",
		button: "Aceptar la invitación",
	},
	// #endregion turbinekit:orgs
};
