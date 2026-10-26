"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { useTranslations } from "next-intl";
import { useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { authErrorMessage } from "@/components/auth/auth-error";
import { authClient, useSession } from "@/lib/auth-client";

type Step =
	| { kind: "idle" }
	| { kind: "password"; action: "enable" | "disable" }
	| { kind: "scan"; totpURI: string; backupCodes: string[] }
	| { kind: "backup"; backupCodes: string[] };

/**
 * Turns two-factor authentication on (password, then scan, then confirm a
 * code, then save the backup codes) or off (password).
 */
export function TwoFactor() {
	const t = useTranslations("Account");
	const te = useTranslations("Auth.errors");
	const { data, refetch } = useSession();
	const enabled = Boolean(
		(data?.user as { twoFactorEnabled?: boolean | null } | undefined)
			?.twoFactorEnabled,
	);
	const [step, setStep] = useState<Step>({ kind: "idle" });
	const [password, setPassword] = useState("");
	const [code, setCode] = useState("");
	const [pending, setPending] = useState(false);

	const close = () => {
		setStep({ kind: "idle" });
		setPassword("");
		setCode("");
	};

	const submitPassword = async (action: "enable" | "disable") => {
		setPending(true);
		if (action === "enable") {
			const { data: result, error } = await authClient.twoFactor.enable({
				password,
			});
			setPending(false);
			// An email-code setup ("otp") has no QR code; this app enables TOTP.
			if (error || !result || !("totpURI" in result)) {
				toast.error(authErrorMessage(error, te));
				return;
			}
			setStep({
				kind: "scan",
				totpURI: result.totpURI,
				backupCodes: result.backupCodes,
			});
			return;
		}
		const { error } = await authClient.twoFactor.disable({ password });
		setPending(false);
		if (error) {
			toast.error(authErrorMessage(error, te));
			return;
		}
		toast.success(t("twoFactor.off"));
		close();
		refetch();
	};

	const confirmCode = async (backupCodes: string[]) => {
		setPending(true);
		const { error } = await authClient.twoFactor.verifyTotp({ code });
		setPending(false);
		if (error) {
			toast.error(authErrorMessage(error, te));
			return;
		}
		setStep({ kind: "backup", backupCodes });
		refetch();
	};

	return (
		<div className="flex items-center justify-between gap-4">
			<Badge variant={enabled ? "default" : "secondary"}>
				{enabled ? t("twoFactor.enabled") : t("twoFactor.disabled")}
			</Badge>
			<Button
				variant="outline"
				onClick={() =>
					setStep({ kind: "password", action: enabled ? "disable" : "enable" })
				}
			>
				{enabled ? t("twoFactor.disable") : t("twoFactor.enable")}
			</Button>

			<Dialog
				open={step.kind !== "idle"}
				onOpenChange={(open) => !open && close()}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{step.kind === "backup"
								? t("twoFactor.backupTitle")
								: t("twoFactor.title")}
						</DialogTitle>
						<DialogDescription>
							{step.kind === "password" && t("twoFactor.passwordPrompt")}
							{step.kind === "scan" && t("twoFactor.scan")}
							{step.kind === "backup" && t("twoFactor.backupDescription")}
						</DialogDescription>
					</DialogHeader>

					{step.kind === "password" && (
						<Input
							type="password"
							autoComplete="current-password"
							aria-label={t("password.current")}
							value={password}
							onChange={(event) => setPassword(event.target.value)}
						/>
					)}
					{step.kind === "scan" && (
						<div className="flex flex-col items-center gap-4">
							<div className="rounded-lg bg-white p-3">
								<QRCode value={step.totpURI} size={176} />
							</div>
							<Input
								inputMode="numeric"
								autoComplete="one-time-code"
								aria-label={t("twoFactor.verify")}
								value={code}
								onChange={(event) => setCode(event.target.value.trim())}
							/>
						</div>
					)}
					{step.kind === "backup" && (
						<ul className="grid grid-cols-2 gap-2 rounded-lg border p-4 font-mono text-sm">
							{step.backupCodes.map((backup) => (
								<li key={backup}>{backup}</li>
							))}
						</ul>
					)}

					<DialogFooter>
						{step.kind === "password" && (
							<Button
								disabled={pending || password.length === 0}
								onClick={() => submitPassword(step.action)}
							>
								{step.action === "enable"
									? t("twoFactor.enable")
									: t("twoFactor.disable")}
							</Button>
						)}
						{step.kind === "scan" && (
							<Button
								disabled={pending || code.length < 6}
								onClick={() => confirmCode(step.backupCodes)}
							>
								{t("twoFactor.verify")}
							</Button>
						)}
						{step.kind === "backup" && (
							<Button
								onClick={() => {
									toast.success(t("twoFactor.done"));
									close();
								}}
							>
								{t("close")}
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
