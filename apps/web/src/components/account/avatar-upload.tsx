"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

/** Uploads a picture to /api/uploads/avatar and shows it at once. */
export function AvatarUpload() {
	const t = useTranslations("Account");
	const { data, refetch } = useSession();
	const input = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);

	const onChange = async (file: File | undefined) => {
		if (!file) {
			return;
		}
		setUploading(true);
		const body = new FormData();
		body.set("file", file);
		const response = await fetch("/api/uploads/avatar", {
			method: "POST",
			body,
		});
		setUploading(false);
		if (!response.ok) {
			toast.error(t("profile.avatarHelp"));
			return;
		}
		toast.success(t("saved"));
		refetch();
	};

	return (
		<div className="flex items-center gap-4">
			<Avatar className="size-16">
				{data?.user.image && <AvatarImage src={data.user.image} alt="" />}
				<AvatarFallback>
					{data?.user.name?.charAt(0).toUpperCase()}
				</AvatarFallback>
			</Avatar>
			<div className="flex flex-col gap-1">
				<Button
					variant="outline"
					size="sm"
					disabled={uploading}
					onClick={() => input.current?.click()}
				>
					{t("profile.avatarUpload")}
				</Button>
				<p className="text-xs text-muted-foreground">
					{t("profile.avatarHelp")}
				</p>
			</div>
			<input
				ref={input}
				type="file"
				accept="image/png,image/jpeg,image/webp,image/gif"
				className="hidden"
				onChange={(event) => onChange(event.target.files?.[0])}
			/>
		</div>
	);
}
