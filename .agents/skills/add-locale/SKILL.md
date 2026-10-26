---
name: add-locale
description: Add a language to a TurbineKit project — the site, the emails, the legal pages, the API docs and the consent banner. Use when the product must be available in a new language.
---

# Add a locale

Use the language's BCP 47 code (`de`, `es`, `pt-BR`). The default locale
keeps bare URLs; the new one gets a prefix (`/de/pricing`).

TurbineKit has French (`fr`), Spanish (`es`), Brazilian Portuguese
(`pt-BR`) and German (`de`) ready. For one of these, take its files from the
template of the project's version instead of translating them: get the
template as in step 1 of the `add-module` skill, copy
`apps/web/messages/<code>.json`, `packages/email/src/strings/<code>.ts`,
`apps/web/content/legal/*/<code>.mdx` and `apps/docs/docs/<code>/`, then add
the lines that `grep -rn "turbinekit:<code>" package/template` finds
(steps 1, 3, 5 and 6), without the markers. If that version doesn't have the
language, translate it as below.

## Steps

1. **Locale list**, `packages/i18n/src/index.ts`: add the code to `locales`,
   its own name to `localeNames` (`Deutsch`), and its Open Graph code to
   `ogLocales` (`de_DE`).
2. **Messages.** Copy `apps/web/messages/en.json` to `<code>.json` and
   translate every value. Keep the keys and the `{placeholders}` exactly;
   keep ICU plural forms valid for the language. `pnpm test` checks keys
   and placeholders against English.
3. **Emails.** Copy `packages/email/src/strings/en.ts` to `<code>.ts`,
   translate it, and register it in `packages/email/src/strings/index.ts`.
4. **Legal pages.** For each folder in `apps/web/content/legal/`, add
   `<code>.mdx`, translated from `en.mdx`, with the same `updated` date.
   Without it, the page shows English and points its canonical URL there.
   Have translated legal text reviewed.
5. **API docs** (if `apps/docs` exists): the docs read the locale list. Run
   `pnpm --filter docs translate` to write `apps/docs/docs/<code>/`, then
   review it. Add the language to the `label` maps of the tabs and footer
   links in `apps/docs/blume.config.ts`.
6. **Consent banner** (if `apps/web/c15t.config.ts` exists): import c15t's
   copy in `apps/web/src/components/consent-manager.tsx` and add it to
   `copy`:

   ```ts
   import { translations as de } from "@c15t/translations/de";

   const copy: Record<Locale, CompleteTranslations> = {
   	en,
   	de,
   };
   ```

   TypeScript fails until every locale has an entry. c15t names Portuguese
   `pt`: use it for `pt-BR`.

## Check

```sh
pnpm typecheck && pnpm test
```

With `pnpm dev`, open `/<code>`, a legal page, and an email in the dev
mailbox after signing up with the site in that language. `/sitemap.xml`
lists the new alternates.

<!-- #region turbinekit:template -->

## In the TurbineKit repository

The CLI offers each language of the template. Also add the code to
`LOCALES` in `tooling/create/src/options.ts` and to `MARKER_IDS` in
`tooling/create/src/markers.ts`, and end each line you add for the language
with `// turbinekit:<code>` (`{/* turbinekit:<code> */}` in MDX), so that
the CLI can remove it. `pnpm --filter create-turbinekit test` checks that
every language has its files.

<!-- #endregion turbinekit:template -->
