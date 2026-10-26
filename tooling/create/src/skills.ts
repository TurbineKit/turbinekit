import type { ModuleId } from "./modules.ts";

/**
 * Third-party agent skills the generator offers to install with
 * `npx skills add`, next to the project's own skills. Sources are GitHub
 * repositories; each install is pinned in skills-lock.json.
 */
export type Skill = {
	name: string;
	source: string;
	/** Picked unless the person unpicks it. */
	recommended?: boolean;
	/** Offered only when this module is in the project. */
	module?: ModuleId;
};

export type SkillGroup = { label: string; skills: Skill[] };

const NEXT = "vercel-labs/openreview";
const VERCEL = "vercel-labs/agent-skills";
const AUTH = "better-auth/skills";
const MARKETING = "coreyhaines31/marketingskills";
const DESIGN = "emilkowalski/skills";

export const SKILL_GROUPS: SkillGroup[] = [
	{
		label: "Next.js and React",
		skills: [
			{ name: "next-best-practices", source: NEXT, recommended: true },
			{ name: "next-cache-components", source: NEXT, recommended: true },
			{ name: "next-upgrade", source: NEXT },
			{
				name: "vercel-react-best-practices",
				source: VERCEL,
				recommended: true,
			},
			{ name: "vercel-composition-patterns", source: VERCEL },
			{ name: "web-design-guidelines", source: VERCEL, recommended: true },
		],
	},
	{
		label: "Auth (better-auth)",
		skills: [
			{ name: "better-auth-best-practices", source: AUTH, recommended: true },
			{
				name: "better-auth-security-best-practices",
				source: AUTH,
				recommended: true,
			},
			{ name: "email-and-password-best-practices", source: AUTH },
			{ name: "two-factor-authentication-best-practices", source: AUTH },
			{ name: "organization-best-practices", source: AUTH, module: "orgs" },
		],
	},
	{
		label: "Marketing and SEO",
		skills: [
			{ name: "seo-audit", source: MARKETING, recommended: true },
			{ name: "ai-seo", source: MARKETING, recommended: true },
			{ name: "schema", source: MARKETING },
			{ name: "programmatic-seo", source: MARKETING },
			{ name: "site-architecture", source: MARKETING },
			{ name: "seo-geo", source: "resciencelab/opc-skills" },
			{ name: "copywriting", source: MARKETING },
			{ name: "copy-editing", source: MARKETING },
			{ name: "launch", source: MARKETING },
			{ name: "directory-submissions", source: MARKETING },
			{ name: "signup", source: MARKETING },
			{ name: "onboarding", source: MARKETING },
			{ name: "cro", source: MARKETING },
			{ name: "pricing", source: MARKETING, module: "payments" },
			{ name: "paywalls", source: MARKETING, module: "payments" },
			{ name: "analytics", source: MARKETING, module: "analytics" },
		],
	},
	{
		label: "Email and design",
		skills: [
			{ name: "react-email", source: "resend/react-email", recommended: true },
			{ name: "emil-design-eng", source: DESIGN },
			{ name: "improve-animations", source: DESIGN },
		],
	},
];

/** The skills that fit the chosen modules. */
export function availableSkills(modules: readonly ModuleId[]): SkillGroup[] {
	return SKILL_GROUPS.map((group) => ({
		label: group.label,
		skills: group.skills.filter(
			(skill) => !skill.module || modules.includes(skill.module),
		),
	}));
}

export function findSkill(name: string): Skill | undefined {
	return SKILL_GROUPS.flatMap((group) => group.skills).find(
		(skill) => skill.name === name,
	);
}

/** One `npx skills add` per source repository. */
export function installCommands(names: readonly string[]): string[][] {
	const bySource = new Map<string, string[]>();
	for (const name of names) {
		const skill = findSkill(name);
		if (skill) {
			bySource.set(skill.source, [...(bySource.get(skill.source) ?? []), name]);
		}
	}
	return [...bySource].map(([source, skills]) => [
		"-y",
		"skills@1.7.4",
		"add",
		source,
		...skills.flatMap((skill) => ["--skill", skill]),
		"--agent",
		"claude-code",
		"--agent",
		"codex",
		"--yes",
	]);
}
