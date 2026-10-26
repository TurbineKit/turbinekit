import { basename, resolve } from "node:path";
import * as p from "@clack/prompts";
import color from "picocolors";
import {
	EMAIL_PROVIDERS,
	type EmailProvider,
	FILES_DRIVERS,
	type FilesDriver,
	MODULES,
	type ModuleId,
} from "./modules.ts";
import {
	type Answers,
	type Flags,
	isEmail,
	LOCALES,
	type Locale,
	toOrigin,
	toSlug,
	toTitle,
} from "./options.ts";
import { availableSkills } from "./skills.ts";

/** Stops on Ctrl+C or Escape, whatever the question. */
function answer<T>(value: T): Exclude<T, symbol> {
	if (p.isCancel(value)) {
		p.cancel("Nothing was created.");
		process.exit(0);
	}
	return value as Exclude<T, symbol>;
}

/** Asks what the options didn't say. */
export async function ask(flags: Flags, defaults: Answers): Promise<Answers> {
	const directory = flags.directory
		? defaults.directory
		: resolve(
				answer(
					await p.text({
						message: "Where should the project go?",
						placeholder: "my-app",
						defaultValue: "my-app",
					}),
				),
			);
	const slug = toSlug(basename(directory));

	const name =
		flags.name ??
		answer(
			await p.text({
				message: "What is the product called?",
				initialValue: toTitle(slug),
				validate: (value) => (value?.trim() ? undefined : "A name, please."),
			}),
		);

	const description =
		flags.description ??
		answer(
			await p.text({
				message: "Describe it in one sentence.",
				placeholder:
					"It is the first line of the home page, the metadata and llms.txt.",
				validate: (value) =>
					value?.trim() ? undefined : "One sentence, please.",
			}),
		);

	const company =
		flags.company ??
		answer(
			await p.text({
				message: "Company or legal name (legal pages, emails)",
				initialValue: name,
			}),
		);

	const email =
		flags.email ??
		answer(
			await p.text({
				message: "Contact email",
				placeholder: "hello@example.com",
				validate: (value) =>
					value && isEmail(value.trim()) ? undefined : "An email address.",
			}),
		);

	const url = flags.url
		? defaults.url
		: toOrigin(
				answer(
					await p.text({
						message: "Production URL, if you know it",
						placeholder: "https://example.com (optional)",
						validate: (value) =>
							!value?.trim() || toOrigin(value)
								? undefined
								: "An http(s) URL, or nothing.",
					}),
				),
			);

	let locales = defaults.locales;
	let defaultLocale = defaults.defaultLocale;
	if (!flags.locales) {
		locales = answer(
			await p.multiselect<Locale>({
				message: "Languages",
				options: Object.entries(LOCALES).map(([value, label]) => ({
					value: value as Locale,
					label,
					hint: value === "en" ? "required" : undefined,
				})),
				initialValues: ["en", "fr"],
				required: true,
			}),
		);
		if (!locales.includes("en")) {
			locales = ["en", ...locales];
			p.log.info("English stays: it is the reference catalog.");
		}
	}
	if (!flags["default-locale"] && locales.length > 1) {
		defaultLocale = answer(
			await p.select<Locale>({
				message: "Which language gets the bare URLs (/pricing)?",
				options: locales.map((value) => ({ value, label: LOCALES[value] })),
				initialValue: "en",
			}),
		);
	}

	const modules = flags.modules
		? defaults.modules
		: answer(
				await p.multiselect<ModuleId>({
					message: "Modules (space to toggle)",
					options: MODULES.map((module) => ({
						value: module.id,
						label: module.label,
						hint: module.hint,
					})),
					initialValues: MODULES.map((module) => module.id),
					required: false,
				}),
			);

	const emailProvider =
		(flags["email-provider"] as EmailProvider | undefined) ??
		answer(
			await p.select<EmailProvider>({
				message: "Email provider",
				options: Object.entries(EMAIL_PROVIDERS).map(([value, provider]) => ({
					value: value as EmailProvider,
					label: provider.label,
					hint: provider.hint,
				})),
				initialValue: "resend",
			}),
		);

	const filesDriver: FilesDriver = !modules.includes("files")
		? "local"
		: ((flags["files-driver"] as FilesDriver | undefined) ??
			answer(
				await p.select<FilesDriver>({
					message: "Where do uploaded files go in production?",
					options: Object.entries(FILES_DRIVERS).map(([value, driver]) => ({
						value: value as FilesDriver,
						label: driver.label,
						hint: driver.hint,
					})),
					initialValue: "local",
				}),
			));

	const lint =
		(flags.lint as Answers["lint"] | undefined) ??
		answer(
			await p.select<Answers["lint"]>({
				message: "Lint and format",
				options: [
					{ value: "biome", label: "TurbineKit's Biome setup", hint: "tabs" },
					{ value: "ultracite", label: "Ultracite", hint: "stricter, spaces" },
				],
				initialValue: "biome",
			}),
		);

	const groups = availableSkills(modules);
	const skills = flags.skills
		? defaults.skills
		: answer(
				await p.groupMultiselect<string>({
					message: "Agent skills to install with the project's own",
					options: Object.fromEntries(
						groups.map((group) => [
							group.label,
							group.skills.map((skill) => ({
								value: skill.name,
								label: skill.name,
								hint: skill.source,
							})),
						]),
					),
					initialValues: groups
						.flatMap((group) => group.skills)
						.filter((skill) => skill.recommended)
						.map((skill) => skill.name),
					required: false,
				}),
			);

	const answers: Answers = {
		directory,
		slug,
		name: name.trim(),
		description: description.trim(),
		company: company.trim() || name.trim(),
		email: email.trim(),
		url,
		locales,
		defaultLocale,
		modules,
		emailProvider,
		filesDriver,
		lint,
		skills,
		install: defaults.install,
		git: defaults.git,
	};

	p.note(summary(answers), "The project");
	const go = answer(await p.confirm({ message: "Create it?" }));
	if (!go) {
		p.cancel("Nothing was created.");
		process.exit(0);
	}
	return answers;
}

export function summary(answers: Answers): string {
	const modules = answers.modules.length
		? MODULES.filter((module) => answers.modules.includes(module.id))
				.map((module) => module.label)
				.join(", ")
		: "none";
	return [
		`${color.bold(answers.name)}: ${answers.description}`,
		`Folder     ${answers.directory}`,
		`Languages  ${answers.locales.join(", ")} (bare URLs: ${answers.defaultLocale})`,
		`Modules    ${modules}`,
		`Email      ${EMAIL_PROVIDERS[answers.emailProvider].label}`,
		...(answers.modules.includes("files")
			? [`Files      ${FILES_DRIVERS[answers.filesDriver].label}`]
			: []),
		`Lint       ${answers.lint === "biome" ? "Biome" : "Ultracite"}`,
		`Skills     ${answers.skills.length ? answers.skills.join(", ") : "only the project's own"}`,
	].join("\n");
}
