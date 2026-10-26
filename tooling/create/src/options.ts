import { basename, resolve } from "node:path";
import { parseArgs } from "node:util";
import {
	EMAIL_PROVIDERS,
	type EmailProvider,
	FILES_DRIVERS,
	type FilesDriver,
	MODULE_IDS,
	type ModuleId,
} from "./modules.ts";
import { availableSkills, findSkill } from "./skills.ts";

export const LOCALES = { en: "English", fr: "Français" } as const;
export type Locale = keyof typeof LOCALES;

export type Answers = {
	/** Where the project goes. */
	directory: string;
	/** npm-safe: the root package name, the package scope, `site.id`. */
	slug: string;
	name: string;
	description: string;
	company: string;
	email: string;
	/** The production origin, when known. */
	url: string | null;
	locales: Locale[];
	defaultLocale: Locale;
	modules: ModuleId[];
	emailProvider: EmailProvider;
	filesDriver: FilesDriver;
	lint: "biome" | "ultracite";
	skills: string[];
	install: boolean;
	git: boolean;
};

export const HELP = `Usage: create-turbinekit [directory] [options]

Creates a TurbineKit project. Without options, it asks its questions.

Options:
  --name <text>             Product name (default: from the directory)
  --description <text>      One sentence about the product
  --company <text>          Company or legal name (legal pages, emails)
  --email <address>         Contact email
  --url <https://…>         Production URL, when you know it
  --locales <list>          en, or en,fr (English is required)
  --default-locale <code>   The language of bare URLs (default: en)
  --modules <list>          all, none, or some of: ${MODULE_IDS.join(", ")}
  --email-provider <id>     ${Object.keys(EMAIL_PROVIDERS).join(" or ")} (default: resend)
  --files-driver <id>       ${Object.keys(FILES_DRIVERS).join(", ")} (default: local)
  --lint <id>               biome (TurbineKit's setup) or ultracite
  --skills <list>           recommended, none, or skill names
  --no-install              Don't install dependencies
  --no-git                  Don't create a git repository
  -y, --yes                 Ask nothing: defaults for what options don't set
  --json                    Print the result as JSON (implies --yes)
  --template <path>         Use a local TurbineKit checkout (development)
  -h, --help                Show this help
  -v, --version             Show the version
`;

export function parseFlags(argv: string[]) {
	const { values, positionals } = parseArgs({
		args: argv,
		allowPositionals: true,
		options: {
			name: { type: "string" },
			description: { type: "string" },
			company: { type: "string" },
			email: { type: "string" },
			url: { type: "string" },
			locales: { type: "string" },
			"default-locale": { type: "string" },
			modules: { type: "string" },
			"email-provider": { type: "string" },
			"files-driver": { type: "string" },
			lint: { type: "string" },
			skills: { type: "string" },
			install: { type: "boolean", default: true },
			git: { type: "boolean", default: true },
			yes: { type: "boolean", short: "y" },
			json: { type: "boolean" },
			template: { type: "string" },
			help: { type: "boolean", short: "h" },
			version: { type: "boolean", short: "v" },
		},
		allowNegative: true,
	});
	return { ...values, directory: positionals[0] };
}

export type Flags = ReturnType<typeof parseFlags>;

/** `My App` → `my-app`: a valid npm name and package scope. */
export function toSlug(text: string): string {
	return (
		text
			.normalize("NFKD")
			.replace(/[̀-ͯ]/g, "")
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^[^a-z]+|-+$/g, "")
			.slice(0, 50) || "app"
	);
}

/** `my-app` → `My App`. */
export function toTitle(slug: string): string {
	return slug
		.split("-")
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

export function isEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** An origin (`https://example.com`), or null when the text isn't one. */
export function toOrigin(value: string | undefined | null): string | null {
	if (!value?.trim()) {
		return null;
	}
	try {
		const url = new URL(value.trim());
		return /^https?:$/.test(url.protocol) ? url.origin : null;
	} catch {
		return null;
	}
}

function list(value: string | undefined): string[] | undefined {
	return value
		?.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

/** Answers from the options alone, with defaults for the rest. */
export function answersFromFlags(flags: Flags): Answers {
	const directory = resolve(flags.directory ?? "my-app");
	const slug = toSlug(basename(directory));
	const name = flags.name?.trim() || toTitle(slug);

	const requestedModules = list(flags.modules);
	const modules: ModuleId[] =
		!requestedModules || requestedModules.includes("all")
			? [...MODULE_IDS]
			: requestedModules.includes("none")
				? []
				: requestedModules.map((id) => {
						if (!(MODULE_IDS as string[]).includes(id)) {
							throw new Error(
								`Unknown module "${id}". Modules: ${MODULE_IDS.join(", ")}.`,
							);
						}
						return id as ModuleId;
					});

	const locales = (list(flags.locales) ?? ["en", "fr"]).map((code) => {
		if (!(code in LOCALES)) {
			throw new Error(
				`Unknown locale "${code}". Locales: ${Object.keys(LOCALES).join(", ")}.`,
			);
		}
		return code as Locale;
	});
	if (!locales.includes("en")) {
		throw new Error("English (en) is required: it is the reference catalog.");
	}
	const defaultLocale = (flags["default-locale"] ?? "en") as Locale;
	if (!locales.includes(defaultLocale)) {
		throw new Error(
			`The default locale "${defaultLocale}" is not in --locales.`,
		);
	}

	const emailProvider = (flags["email-provider"] ?? "resend") as EmailProvider;
	if (!(emailProvider in EMAIL_PROVIDERS)) {
		throw new Error(`Unknown email provider "${emailProvider}".`);
	}
	const filesDriver = (flags["files-driver"] ?? "local") as FilesDriver;
	if (!(filesDriver in FILES_DRIVERS)) {
		throw new Error(`Unknown files driver "${filesDriver}".`);
	}
	const lint = flags.lint ?? "biome";
	if (lint !== "biome" && lint !== "ultracite") {
		throw new Error(`Unknown lint setup "${lint}": biome or ultracite.`);
	}

	const offered = availableSkills(modules).flatMap((group) => group.skills);
	const requestedSkills = list(flags.skills) ?? ["recommended"];
	const skills = requestedSkills.includes("none")
		? []
		: requestedSkills.includes("recommended")
			? offered.filter((skill) => skill.recommended).map((skill) => skill.name)
			: requestedSkills.map((skill) => {
					if (!findSkill(skill)) {
						throw new Error(`Unknown skill "${skill}".`);
					}
					return skill;
				});

	const email = flags.email?.trim() || "hello@example.com";
	if (!isEmail(email)) {
		throw new Error(`"${email}" is not an email address.`);
	}
	const url = toOrigin(flags.url);
	if (flags.url && !url) {
		throw new Error(`"${flags.url}" is not an http(s) URL.`);
	}

	return {
		directory,
		slug,
		name,
		description:
			flags.description?.trim() || `${name} helps people get their work done.`,
		company: flags.company?.trim() || name,
		email,
		url,
		locales,
		defaultLocale,
		modules,
		emailProvider,
		filesDriver: modules.includes("files") ? filesDriver : "local",
		lint,
		skills,
		install: flags.install ?? true,
		git: flags.git ?? true,
	};
}
