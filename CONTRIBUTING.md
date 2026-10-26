# Contributing

This repository is both the TurbineKit template and the `create-turbinekit`
CLI (`tooling/create`). With every module on, the template runs as a
normal project: `SETUP.md` gets it running.

## Checks

```sh
pnpm lint && pnpm typecheck && pnpm test
```

`pnpm test` includes the CLI's tests: every marker in the template must
parse, and every path, dependency, script and message key in the module
manifests (`tooling/create/src/modules.ts`) must exist.

## Markers

The CLI removes the modules a project doesn't pick, using markers in the
code:

- A block: `// #region turbinekit:<id>` … `// #endregion turbinekit:<id>`.
  JSX and MDX: `{/* #region turbinekit:<id> */}`. Markdown: HTML comments.
  `.env` and YAML: `# #region turbinekit:<id>`.
- One line: a trailing `// turbinekit:<id>`, only on a line that stays one
  line after `pnpm format`.
- `a|b`: kept if either is on. `a+b`: kept if both are.
- `!turbinekit:<id>`: kept only when the module is off. Write it commented
  out: the template has every module on.
- `template`: only in this repository, never in a project.

Ids: `files`, `files-s3`, `files-blob`, `docs`, `analytics`, `consent`,
`orgs`, `admin`, `payments`, `resend`, `email-sdk`, `template`, and the
language codes `fr`, `es`, `pt-BR`, `de`.

Whole files, dependencies, scripts, `turbo.json` variables and message keys
(JSON can't hold comments) belong to a module through its manifest in
`tooling/create/src/modules.ts`.

## Testing the generator

Generate a project from your checkout:

```sh
node tooling/create/src/index.ts /tmp/my-app --template . --yes --modules orgs,payments
cd /tmp/my-app && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

The `cli` workflow does this for a matrix of module choices on every pull
request. When you add a module, add its variant there.

## Releases

Add a changeset to each pull request that changes what the CLI generates:
`pnpm changeset`. `create-turbinekit` and `turbinekit` always share a
version.

1. Merge the pull request. On `main`, the release workflow opens or updates
   the "Version Packages" pull request: the next version, the changelogs, and
   the same version in `turbinekit.json`.
2. To release, open that pull request. The workflow's own token opened it,
   so GitHub holds its checks: select **Approve workflows to run**, wait for
   the checks, then merge it.
3. The release workflow publishes both packages with npm trusted publishing
   (there is no npm token), tags them, and writes one GitHub release,
   `v<version>`, from the changelog of `create-turbinekit`.

The template is bundled into the package, so each version generates a fixed
template.

## README images

The logos in `.github/assets/` come from the brand package of the TurbineKit
site (`packages/brand/assets/lockup/` in `turbinekit-web`), where its export
script makes them. After a change to the brand, copy them again.
`TEMPLATE_ONLY` keeps them out of projects.
