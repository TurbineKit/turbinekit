"use client";

import { track } from "@repo/analytics/client"; // turbinekit:analytics
import type { ProjectRecord } from "@repo/api/services/projects";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Field, FieldGroup, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { FolderIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import {
	createProjectAction,
	deleteProjectAction,
	updateProjectAction,
} from "@/app/[locale]/(app)/projects/actions";
import { useRouter } from "@/i18n/navigation";

type Editing = { kind: "create" } | { kind: "edit"; project: ProjectRecord };

export function Projects({ projects }: { projects: ProjectRecord[] }) {
	const t = useTranslations("Projects");
	const format = useFormatter();
	const router = useRouter();
	const [editing, setEditing] = useState<Editing | null>(null);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [pending, setPending] = useState(false);

	const open = (next: Editing) => {
		setEditing(next);
		setName(next.kind === "edit" ? next.project.name : "");
		setDescription(
			next.kind === "edit" ? (next.project.description ?? "") : "",
		);
	};

	const onSubmit = async (event: FormEvent) => {
		event.preventDefault();
		if (!editing) {
			return;
		}
		setPending(true);
		const creating = editing.kind === "create";
		const result = creating
			? await createProjectAction({ name, description })
			: await updateProjectAction(editing.project.id, { name, description });
		setPending(false);
		if (result.error) {
			toast.error(result.error);
			return;
		}
		// #region turbinekit:analytics
		if (creating) {
			track("project_created", {});
		}
		// #endregion turbinekit:analytics
		toast.success(creating ? t("created") : t("saved"));
		setEditing(null);
		router.refresh();
	};

	const remove = async (project: ProjectRecord) => {
		if (!window.confirm(t("deleteConfirm", { name: project.name }))) {
			return;
		}
		const result = await deleteProjectAction(project.id);
		if (result.error) {
			toast.error(result.error);
			return;
		}
		toast.success(t("deleted"));
		router.refresh();
	};

	return (
		<div className="flex flex-col gap-4">
			<div>
				<Button onClick={() => open({ kind: "create" })}>{t("create")}</Button>
			</div>
			{projects.length === 0 ? (
				<p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
					{t("empty")}
				</p>
			) : (
				<ul className="divide-y rounded-lg border">
					{projects.map((project) => (
						<li key={project.id} className="flex items-center gap-3 px-4 py-3">
							<FolderIcon className="size-4 text-muted-foreground" />
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">{project.name}</p>
								<p className="truncate text-xs text-muted-foreground">
									{project.description ||
										t("updatedAt", {
											date: format.dateTime(new Date(project.updatedAt), {
												dateStyle: "medium",
											}),
										})}
								</p>
							</div>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={t("edit")}
								onClick={() => open({ kind: "edit", project })}
							>
								<PencilIcon />
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={t("delete")}
								onClick={() => remove(project)}
							>
								<Trash2Icon />
							</Button>
						</li>
					))}
				</ul>
			)}

			<Dialog
				open={editing !== null}
				onOpenChange={(next) => !next && setEditing(null)}
			>
				<DialogContent>
					<form onSubmit={onSubmit}>
						<DialogHeader>
							<DialogTitle>
								{editing?.kind === "edit" ? t("edit") : t("create")}
							</DialogTitle>
						</DialogHeader>
						<FieldGroup className="my-6">
							<Field>
								<FieldLabel htmlFor="project-name">{t("name")}</FieldLabel>
								<Input
									id="project-name"
									required
									maxLength={120}
									value={name}
									onChange={(event) => setName(event.target.value)}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="project-description">
									{t("descriptionLabel")}
								</FieldLabel>
								<Textarea
									id="project-description"
									maxLength={2000}
									value={description}
									onChange={(event) => setDescription(event.target.value)}
								/>
							</Field>
						</FieldGroup>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setEditing(null)}
							>
								{t("cancel")}
							</Button>
							<Button type="submit" disabled={pending}>
								{t("save")}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
