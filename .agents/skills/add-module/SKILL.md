---
name: add-module
description: Bring a TurbineKit module into a project that was created without it (files, docs, analytics, consent, orgs, admin, payments), from the TurbineKit version the project started on. Use when someone wants teams, an admin console, payments, analytics, a consent banner, file uploads or API docs added to an existing TurbineKit project.
---

# Add a module

A project made by `create-turbinekit` holds only the modules it chose
(`turbinekit.json`). The full template, with every module and its markers,
ships inside the `create-turbinekit` package of the same version.

## 1. Get the template of the project's version

```sh
version=$(node -p "require('./turbinekit.json').version")
mkdir -p /tmp/turbinekit && cd /tmp/turbinekit
npm pack "create-turbinekit@$version" && tar -xzf create-turbinekit-*.tgz
```

`package/template/` is the full template. `package/modules.json` is the
manifest: for each module, its `files`, its `dependencies` per
`package.json`, its root `scripts`, its `turbo` variables, its `messages`
keys, and in `requires` the other modules it needs.

## 2. Copy the module

Read the module's entry in `modules.json`, then:

1. **Files.** Copy each path in `files` from the template into the project.
   The template's packages are named `@repo/*`: rename the imports to the
   project's scope (see the root `package.json` name, or any
   `packages/*/package.json`).
2. **Marked code in shared files.** Search the template for the marker:
   `grep -rn "turbinekit:<id>" package/template`. For each file that has
   regions or marked lines for the module (and for `<id>|…` and `…+<id>`
   when the other module is on too), find the same place in the project's
   file and insert the code there, without the markers. The project's
   files may have changed since: keep its changes, and adapt the inserted
   code to them.
3. **`!turbinekit:<id>` blocks**: the project has their uncommented
   content. Remove it: the module replaces it.
4. **Dependencies and scripts**: add the manifest's `dependencies` to each
   `package.json`, and its `scripts` to the root one.
5. **Messages**: copy the manifest's `messages` keys from the template's
   `apps/web/messages/<locale>.json` into each project locale. Translate
   them for locales the template doesn't have.
6. **Environment**: copy the module's block of the template's
   `.env.example`, and its section of `SETUP.md` and `LAUNCH.md`. Add the
   `turbo` variables to `turbo.json` (`tasks.build.env`).

## 3. Database and install

```sh
pnpm install
pnpm db:generate     # the module's tables, if it has any
pnpm db:migrate
```

`orgs` and `admin` add better-auth plugins: run `pnpm auth:generate`
before `pnpm db:generate`.

## 4. Finish

- Add the module to `modules` in `turbinekit.json`.
- `pnpm lint && pnpm typecheck && pnpm test` pass.
- Follow the module's section of `SETUP.md`, then try it in `pnpm dev`.
