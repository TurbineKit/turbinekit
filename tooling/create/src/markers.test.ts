import { describe, expect, it } from "vitest";
import { holds, MarkerError, stripMarkers } from "./markers.ts";

const on = (...ids: string[]) => new Set(ids);

describe("holds", () => {
	it("reads one id, any of (|) and all of (+)", () => {
		expect(holds("orgs", on("orgs"))).toBe(true);
		expect(holds("orgs|admin", on("admin"))).toBe(true);
		expect(holds("orgs+admin", on("admin"))).toBe(false);
		expect(holds("orgs+admin", on("orgs", "admin"))).toBe(true);
	});

	it("refuses unknown ids and mixed operators", () => {
		expect(() => holds("teams", on())).toThrow(/unknown module "teams"/);
		expect(() => holds("orgs|admin+docs", on())).toThrow(/not both/);
	});
});

describe("stripMarkers in code", () => {
	const source = [
		"import { a } from 'a';",
		"import { b } from 'b'; // turbinekit:orgs",
		"// #region turbinekit:admin",
		"admin();",
		"// #region turbinekit:orgs",
		"adminAndOrgs();",
		"// #endregion turbinekit:orgs",
		"// #endregion turbinekit:admin",
		"done();",
	].join("\n");

	it("keeps everything, without markers, when all modules are on", () => {
		expect(stripMarkers(source, on("orgs", "admin"))).toBe(
			[
				"import { a } from 'a';",
				"import { b } from 'b';",
				"admin();",
				"adminAndOrgs();",
				"done();",
			].join("\n"),
		);
	});

	it("removes a disabled module's lines and blocks, nested ones included", () => {
		expect(stripMarkers(source, on("orgs"))).toBe(
			["import { a } from 'a';", "import { b } from 'b';", "done();"].join(
				"\n",
			),
		);
	});

	it("uncomments a ! block when its module is off, and drops it when on", () => {
		const text = [
			"// #region !turbinekit:consent",
			'// cookieless_mode: "always",',
			"// #endregion !turbinekit:consent",
		].join("\n");
		expect(stripMarkers(text, on())).toBe('cookieless_mode: "always",');
		expect(stripMarkers(text, on("consent"))).toBe("");
	});

	it("handles JSX markers", () => {
		const text = [
			"<div>",
			"\t{/* #region turbinekit:docs */}",
			"\t<Docs />",
			"\t{/* #endregion turbinekit:docs */}",
			"</div>",
		].join("\n");
		expect(stripMarkers(text, on(), "a.tsx")).toBe("<div>\n</div>");
	});
});

describe("stripMarkers in other files", () => {
	it("handles MDX line markers and ! blocks", () => {
		const text = [
			"- Files: your avatar. {/* turbinekit:files */}",
			"{/* #region !turbinekit:consent",
			"PostHog runs without cookies.",
			"#endregion !turbinekit:consent */}",
		].join("\n");
		expect(stripMarkers(text, on("files", "consent"), "a.mdx")).toBe(
			"- Files: your avatar.",
		);
		expect(stripMarkers(text, on(), "a.mdx")).toBe(
			"PostHog runs without cookies.",
		);
	});

	it("handles Markdown and env files", () => {
		const md = "- `packages/billing`: Stripe. <!-- turbinekit:payments -->";
		expect(stripMarkers(md, on(), "AGENTS.md")).toBe("");
		const env = [
			"# #region turbinekit:payments",
			"STRIPE_SECRET_KEY=",
			"# #endregion turbinekit:payments",
			"CRON_SECRET=",
		].join("\n");
		expect(stripMarkers(env, on(), ".env.example")).toBe("CRON_SECRET=");
	});

	it("leaves prose that talks about markers alone", () => {
		const text = "A line: a trailing `// turbinekit:<module>`, then text.";
		expect(stripMarkers(text, on(), "AGENTS.md")).toBe(text);
	});
});

describe("errors", () => {
	it("reports a block closed by the wrong marker", () => {
		const text =
			"// #region turbinekit:orgs\nx\n// #endregion turbinekit:admin";
		expect(() => stripMarkers(text, on(), "a.ts")).toThrow(MarkerError);
		expect(() => stripMarkers(text, on(), "a.ts")).toThrow(
			/a\.ts:3: turbinekit:admin closes turbinekit:orgs/,
		);
	});

	it("reports a block that never closes", () => {
		expect(() =>
			stripMarkers("// #region turbinekit:docs\nx", on(), "a.ts"),
		).toThrow(/a\.ts:1: turbinekit:docs is never closed/);
	});
});
